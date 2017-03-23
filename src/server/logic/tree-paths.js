const _ = require('lodash');

const sample1 = [
    ['10A', '10B'], ['20C','20D'], ['30E', '30F']
];

const sample = [
    [{freq: 10, name: 'A'}, {freq: 10, name: 'B'}],
    [{freq: 20, name: 'C'}, {freq: 20, name: 'D'}], 
    [{freq: 30, name: 'E'}]
];

//console.log(mk(sample1)[0]);

// pfo1Arr = [10A,20C]
// pfo2Arr = [30E,30F]
// result should be: [[10A,20C,30E], [10A,20C,30F]]
const mkCombOfFirstArrBasedOnSecArr = (pfoArr1, pfoArr2) => {    
    return pfoArr2.map(pfo2Elem => {
        // if pfoArr1 doesnt contain the name of pfo2Elem, then concat        
        return pfoArr1.concat(pfo2Elem);        
    });
};
//console.log(mkCombOfFirstArrBasedOnSecArr(['10A','20C'], ['30E', '30F']));
//console.log(mkCombOfFirstArrBasedOnSecArr([], ['10A']));

// Sort of like a cartesian product
// ================================
// pfo1Arr = [10A,10B]
// pfo2Arr = [20C,20D]
// result should be:
//  [
//      [[10A,20C],[10A,20D]], 
//      [[10B,20C],[10B,20D]]
//  ]
const mkCPOfTwoArrsWConstraints = (pfoArr1, pfoArr2) => {
    return pfoArr1.map(e => {
        return mkCombOfFirstArrBasedOnSecArr([e],pfoArr2);
    });
};
//console.log(mkCPOfTwoArrsWConstraints(['10A','10B'], ['20C', '20D']));


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
                return mkCombOfFirstArrBasedOnSecArr(res2, elem);
            }

            // 1) res2 = [[10A]] + elem = [20C,20D] --(new res2) --> [[10A,20C],[10A,20D]]            
            res2 = _.flatten(res2.reduce((res3, elemInner) => {
                // 1.1) elemInner = [10A] + elem = [20C,20D] --(new res2) --> [[10A,20C],[10A,20D]]
                res3.push(mkCombOfFirstArrBasedOnSecArr(elemInner, elem));
                return res3;
            },[]));

            //console.log("res2:", res2);
            return res2;
        },[]);

        res1.push(innerResult);
        return res1;
    },[]) );
};

console.log(mk2(sample1));