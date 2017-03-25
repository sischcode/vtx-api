const _ = require('lodash');
//const Combinatorics = require('js-combinatorics');

/**
 * Returns true if the element (identified by its name) isn't already in the array
 * @param {Array.<*>} arr 
 * @param {*} elem 
 */
const elemIsNotContainedIn = (arr, elem) => {
    return !arr.find(e => e.pilotName === elem.pilotName);
};

/**
 * "Appends"" an element to the array if the constraint is passed, otherwise the original array is returned.
 * (A new array is returned, the original array is NOT mutated)
 * @param {Array.<*>} arr the array to "append" to
 * @param {*} elem the element to "append" to the array, if the constraint is passed
 * @param {*} fnConstraint the constraint the element has to pass, to be added to the array
 */
const appendIf = (arr, elem, fnConstraint = () => true) => {    
    if(fnConstraint(arr,elem)) {
        return arr.concat(elem);
    }
    return arr;
};
//console.log(appendIf( [{freq: 10, pilotName: 'A'}, {freq: 10, pilotName: 'B'}], {freq: 20, pilotName: 'A'}, elemIsNotContainedInArr ) );


/**
 * Example:
 * --------
 * initialSet = [10A,20C]; combSetElems = [30E,30F]; returned result: [[10A,20C,30E], [10A,20C,30F]]
 * 
 * This is like doing a union (∪) operation for every element in the "combSetElems" and the original "initialSet".
 * i.e. 1) {10A,20C} ∪ {30E} = {10A,20C,30E}
 *      2) {10A,20C} ∪ {30F} = {10A,20C,30F}
 *
 * (Technically it's more a "union all", since this could hold duplicates as of the current implementation)
 * 
 * @param {Array.<*>} initialSet
 * @param {Array.<*>} combSetElems 
 * @param {*} fnConstraint constraint function 
 * @returns {Array.<{Array.<*>}>}
 */
const generateSetsFrom = (initialSet, combSetElems, fnConstraint = elemIsNotContainedIn) => {    
    return combSetElems.map(combSetElem => {
        return appendIf(initialSet, combSetElem, fnConstraint);
    }).filter(e => e.length > initialSet.length);
};

/**
 * Example input: a) [[10A],[20C],[30B,30F]]         --> [[10A,20C,30B], [10A,20C,30F]]
 *                b) [[10A],[20C,20A],[30B,30F]]     --> [[10A,20C,30B], [10A,20C,30F]]
 *                c) [[10A],[20C,20A,20E],[30B,30F]] --> [[10A,20C,30B], [10A,20C,30F], [10A,20E,30B], [10A,20E,30F]]
 * 
 * @param {*} flatTree 
 */
const computePathsForTree = (flatTree, fnConstraint = elemIsNotContainedIn) => {
    return flatTree.reduce( (outerRes,outerElem) => {    // elem is an array of starting points!
        if(outerRes.length === 0) {
            // 0) resOuter = []; elem = [10A] --(new resOuter) --> [[10A]]               
            return generateSetsFrom(outerRes, outerElem, fnConstraint);
        }

        return _.flatten(outerRes.reduce((innerRes, innerElem) => {
            innerRes.push(generateSetsFrom(innerElem, outerElem, fnConstraint));
            return innerRes;
        },[]));

    },[]);
};

/**
 * i.e. "flatTrees" of [[10A,10B],[20C],[30B,30F]] would result in
 *      "treeBases" of [ [[10A],[20C],[30B,30F]],
 *                       [[10B],[20C],[30B,30F]] ]
 * 
 * For each individual "treeBase" the "computePathsForTree" is then called,
 * generating the individual paths for the individual tree.
 * 
 * All these individual paths are then reduced into one array, since we're
 * only interested in the paths itself, not from which tree they originally 
 * stem from.
 * 
 * Note: What we do here is essentially some sort of cartesian product, with
 * the difference, that we can "add" a constraint on top, that determines
 * if we need to continue building a path.
 * 
 * @param {*} flatTrees 
 */
const computePathsForTrees = (flatTrees, fnConstraint = elemIsNotContainedIn) => {
    const [head, ...tail] = flatTrees;
    const treeBases = head.map(e => {
        return [ [e], ...tail ];
    });

    // i.e. currFlatTree: [[10A],[20C,20D],[30E,30F]]
    return _.flatten(treeBases.reduce((res, currFlatTree) => {
        res.push(computePathsForTree(currFlatTree, fnConstraint));
        return res;
    },[]));
};


module.exports = {
    computePathsForTrees
};


/*
const sampleFlatTree = [
    [{freq: 10, pilotName: 'A'}],
    [{freq: 20, pilotName: 'C'}, {freq: 20, pilotName: 'A'}, {freq: 20, pilotName: 'E'}], 
    [{freq: 30, pilotName: 'B'}, {freq: 30, pilotName: 'F'}]
];
console.log(computePathsForTree(sampleFlatTree));
*/

/*
const sampleFlatTrees = [
    [{freq: 10, pilotName: 'A'}, {freq: 10, pilotName: 'B'}],
    [{freq: 20, pilotName: 'C'}, {freq: 20, pilotName: 'A'}, {freq: 20, pilotName: 'E'}], 
    [{freq: 30, pilotName: 'B'}, {freq: 30, pilotName: 'F'}]
];
console.log(computePathsForTrees(sampleFlatTrees));
*/

//console.log(Combinatorics.cartesianProduct(...sampleFlatTrees).toArray());

