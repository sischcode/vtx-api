const _ = require('lodash');
const Combinatorics = require('js-combinatorics');

/**
 * This is a bit like a cartesian product, but with the difference, that the result
 * is not return as one set (array) of combinations.
 * Instead we build multiple arrays, based on the # of elements in the first array.
 * (We kind of treat the elements in the first array as the root elements of multiple
 * trees.)
 * 
 * Example:
 * --------
 * rootElems = ['10A','10B', '10F']
 * leafElems = ['20C', '20D']
 * return result: [ [[ '10A', '20C' ], [ '10A', '20D' ]],
 *                  [[ '10B', '20C' ], [ '10B', '20D' ]],
 *                  [[ '10F', '20C' ], [ '10F', '20D' ]] ]
 * 
 * @param {Array.<*>} rootElems 
 * @param {Array.<*>} leafElems 
 */
const mkCPOfTwoArrsWConstraints = (rootElems, leafElems) => {
    return rootElems.map(e => {
        return generateSetsFrom([e],leafElems);
    });
};
//console.log(mkCPOfTwoArrsWConstraints(['10A','10B', '10F'], ['20C', '20D']));


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


// i.e. base = [[10A,10B],[20C,20D],[30E,30F]]
const mk2 = (base) => {
    // treebase would be: [[[10A],[20C,20D],[30E,30F]], [[10B],[20C,20D],[30E,30F]]]
    const [head, ...tail] = base;
    const treeBase = head.map(e => {
        return [ [e], ...tail ];
    });

    // i.e. cTreeBase: [[10A],[20C,20D],[30E,30F]]
    return _.flatten(treeBase.reduce( (res1, cTreeBase) => {
        // i.e. elem = [10A]
        const innerResult = cTreeBase.reduce( (res2,elem) => {    // elem is an array of starting points!
            if(res2.length === 0) {
                // 0) res2 = []; elem = [10A] --(new res2) --> [[10A]]               
                return generateSetsFrom(res2, elem);
            }

            // 1) res2 = [[10A]] + elem = [20C,20D] --(new res2) --> [[10A,20C],[10A,20D]]            
            res2 = _.flatten(res2.reduce((res3, elemInner) => {
                // 1.1) elemInner = [10A] + elem = [20C,20D] --(new res2) --> [[10A,20C],[10A,20D]]
                res3.push(generateSetsFrom(elemInner, elem));
                return res3;
            },[]));

            //console.log("res2:", res2);
            return res2;
        },[]);

        res1.push(innerResult);
        return res1;
    },[]) );
};

module.exports = {
    mk2
};

/*
const sample = [
    [{freq: 10, pilotName: 'A'}, {freq: 10, pilotName: 'B'}],
    [{freq: 20, pilotName: 'C'}], 
    [{freq: 30, pilotName: 'B'}, {freq: 30, pilotName: 'F'}]
];


console.log(mk2(sample));
console.log("----------");
console.log(Combinatorics.cartesianProduct(...sample).toArray());
*/