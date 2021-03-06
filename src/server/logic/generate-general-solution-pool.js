const _ = require('lodash');

const FrequencyObject = require('./classes/FrequencyObject');
const FrequencyUtils = require('./classes/FrequencyUtils');

const DEFAULT_FREQ_POOL_ALL5P8 = FrequencyUtils.getAll5P8FreqsAsOrderedFreqObjArr();

/**
 * Split a pool of frequencies in head and tail, by the first frequency in the pool and the min-gap between frequencies:
 * a) head = starting point (pool[0])
 * b) tail = list of freqs with at least "minGap" distance to the head frequency
 * 
 * Example: minGap=3 and pool=[3,5,8,11] will result in [3,[8,11]]
 * 
 * This actually is a representation for the tree:
 *      3
 *     / \
 *    8  11
 * 
 * @param {number} minGap minimal mhz distance between frequencies in the pool
 * @param {Array.<{freq: number}>} pool asc-ordered, constrained (min/max-wise) pool of frequencies
 * @returns {Array.<{freq: number}>}
 */
const genDistConstraintFlatSubtree = (minGap, pool) => {
    const [head, ...tail] = pool;
    const freqsFiltered = tail.filter((fObj) => (fObj.freq - head.freq >= minGap));
    return [head, freqsFiltered];
};


/**
 * Constraint on minimal frequency. (curried function)
 * @param {number} minFreq the minimal frequency
 * @param {{freq: number}} input the input to apply the constraint to
 * @returns {boolean}
 */
const minFreqConstraint = (minFreq) => {
    return function constraint(input) {
        return input.freq >= minFreq;
    }    
}

/**
 * Constraint on maximal frequency. (curried function)
 * @param {number} maxFreq the maximal frequency
 * @param {{freq: number}} input the input to apply the constraint to
 * @returns {boolean}
 */
const maxFreqConstraint = (maxFreq) => {
    return function constraint(input) {
        return input.freq <= maxFreq;
    }   
}

/**
 * Generates a list of "flattened" one-level-deep sub trees for a given pool of frequencies and constraints. 
 * Currently the default constrains are a minimal gap between frequencies and a min/max frequency.
 * (This is done by simply shifting the input and calling the function 'genDistConstraintFlatSubtree')
 * 
 * Example: 
 * -------
 * minGap=3; pool=[3,5,8,11] will result in [[3,[8,11]], [5,[8,11]], [8,[11]], [11,[]]]
 * 
 * This actually is a representation for the trees:
 *
 * 1)     3
 *       / \
 *      8  11
 * 
 * 2)     5
 *       / \
 *      8   11
 * 
 * 3) 8
 *    |
 *    11
 * 
 * 4) 11
 * 
 * @param {number} minGap minimal mhz distance between frequencies in the pool
 * @param {Array.<{freq: number}>} pool asc-ordered, constrained (min/max-wise) pool of frequencies
 * @param {*} WTF man. How do I document an array of functions here, and also that these functions return a boolean!?
 * @returns {Array.<Array.<{freq: number}>>}
 */
const genFlatSubtreesFromConstraintFreqPool 
    = (
        minGap = 60, 
        pool = DEFAULT_FREQ_POOL_ALL5P8,
        constraints = [
            minFreqConstraint(pool[0].freq),
            maxFreqConstraint(pool[pool.length-1].freq)
        ]
    ) => {

    // create initial pool based on frequency constraints
    const allowedFreqPool = pool.filter((fObj) => {
        return constraints.every(constraint => {
            return constraint(fObj);
        })
    });


    // recursion would be more elegant, so we don't have to filter the list n-times in the reduce, but heck...it's working
    return allowedFreqPool.map( (fObj) => {
        // generate a list (tail) of frequencies gt or equal to the current freq
        // i.e.: i0: f=3; l=[3,5,7,14]; i1: f=5; l=[5,7,14]; i2: f=7; l=[7,14]
        const remPool = allowedFreqPool.filter((e) => e.freq >= fObj.freq);
        // add result of split to the the return list.
        return genDistConstraintFlatSubtree(minGap, remPool);
    });
};

/**
 * Build "solutions" by constructing the actual paths and sub-paths of trees 
 * (in flattened, one-level-deep form) that we get as input.
 * The input is (usually) already constraint.
 * 
 * Example:
 * ========
 * Given the input of: [ [3,[8,11]], [5,[8,11]], [8,[11]], [11, []] ], the 
 * resulting trees will be: 
 *
 * 1)
 *            3
 *          /   \
 *         8    11
 *        /
 *       11
 *                   
 *       Paths: [[3,8], [3,8,11], [3,11]]
 *
 * 2)
 *            5
 *          /   \
 *         8    11
 *        /
 *       11
 *
 *       Paths: [[5,8], [5,8,11], [5,11]]
 *
 * 3)
 *       8
 *       |
 *       11
 *
 *       Paths: [[8,11]]
 * 
 * Since we're only interested in the paths and not from which tree a path
 * stems from, it's reduced into on array of paths. So, the result will be:
 * 
 *   [[3,8], [3,8,11], [3,11],
 *    [5,8], [5,8,11], [5,11],
 *    [8,11]]
 * 
 * @param {*} TODO
 * @returns {Array.<{freq: number}>} An array of all solutions (i.e. paths)
 */
const evaluatePathsFromFlatSubtrees = (flatSubtreesArr) => {
    /**
     * rec.-function to build up one(!) tree, or to be more specific, its paths'.
     * (though it is not completely functional!)
     *
     * Example:
     * --------
     * Given the input of: [ [3,[8,11]], [5,[8,11]], [8,[11]], [11, []] ] and the 
     * first element ([3,[8,11]]) as a starting point, we will construct the tree:
     *            3
     *          /   \
     *         8    11
     *        /
     *       11
     * The paths' of this tree would be: [[3,8],[3,8,11],[3,11]]
     * 
     * Note: missing sub-paths, like i.e. [8,11] will be constructed when 
     *       constructing the tree for starting point with root-element of "8".
     * 
     * @param {*} root a single root node. i.e. 3
     * @param {*} leafs an array containing the child elements in a flat array. i.e. [8,11]
     * @param {*} lookup the complete flattened trees. i.e. [ [3,[8,11]], [5,[8,11]], [8,[11]], [11, []] ]
     * @param {*} path the path we build up so far, for this walk
     * @param {*} paths all paths we've found
     */
    const buildTreePathsRec = (root, leafs, lookup, path, paths) => {        
        path.push(root);
        // we're only interested in paths with more than one node involved
        if(path.length >= 2) {
            paths.push(path);
        }
        if(leafs.length === 0) {
            return paths;
        }
        leafs.forEach(leaf => {
            const [nHead, nTail] = lookup.find(e => e[0].freq === leaf.freq);
            buildTreePathsRec(nHead, nTail, flatSubtreesArr, [].concat(path), paths);
        });
        return paths;
    };

    // concatenate all paths from all trees into one array of paths
    // by doing so, we generate an array that contains all paths of all trees.
    return flatSubtreesArr.reduce( (combPaths, treeStart) => {
        // if the paths' of all sub trees should be in a separate array, just
        // make a "combPaths.push()" instead of a concat.        
        return combPaths.concat(buildTreePathsRec(treeStart[0], treeStart[1], flatSubtreesArr, [], []) );    
    },[]);

};

/**
 * Generate the (general) solutions for a set of constraints.
 * 
 * @param {number} numPilots Constraint: fix number of pilots (or # of minimal elements in a solution-array, to be more abstract)
 * @param {number} minMhzDistance Constraint: How many MHz distance must be between frequencies 
 * @param {Array.<{freq: number, ident: string}>} ordFreqObjPool An ASC-ordered, unconstraint, frequency pool/list
 * @param {number} minFreq Constraint: Minimal frequency
 * @param {number} maxFreq Constraint: Maximal frequency
 */
const getSolutionsForConstraints = (numPilots = 2, 
                                    minMhzDistance = 60,
                                    ordFreqObjPool = DEFAULT_FREQ_POOL_ALL5P8,
                                    minFreq = ordFreqObjPool[0].freq, 
                                    maxFreq = ordFreqObjPool[ordFreqObjPool.length-1].freq) => {

    // applying minMhzDistance and min/max-frequency constraints on this    
    const flatSubTrees 
        = genFlatSubtreesFromConstraintFreqPool(minMhzDistance, 
                                                ordFreqObjPool,
                                                [minFreqConstraint(minFreq), maxFreqConstraint(maxFreq)] );

    const solutionPaths = evaluatePathsFromFlatSubtrees(flatSubTrees);

    // applying the numPilots constraint on this 
    const solutionPathsMinElems = solutionPaths.filter((path) => path.length == numPilots);
    
    return _.uniqBy(solutionPathsMinElems, FrequencyObject.getIdentOfObjArr);
};


module.exports = {
    getSolutionsForConstraints
};


/*
const minDistance = 3;
const sample = [ {freq: 3, ident: '3'}, {freq: 5, ident: '5'}, {freq: 8, ident: '8'}, {freq: 11, ident: '11'}];

console.log("minimal sample input:\n ", sample);
console.log("----------------------------------");

console.log("single split:\n", genDistConstraintFlatSubtree(minDistance, sample));
console.log("----------------------------------");

console.log("multiple split:\n", genFlatSubtreesFromConstraintFreqPool(minDistance, sample));
console.log("----------------------------------");

console.log("possible combinations:\n", evaluatePathsFromFlatSubtrees(genFlatSubtreesFromConstraintFreqPool(minDistance, sample)));
console.log("----------------------------------");

console.log("solutions with solution-array min-size 3:\n", getSolutionsForConstraints(3,3,sample));
*/