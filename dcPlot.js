console.log('loading dcPlot.js ...')

confluence={
    coreData:[]
}


fetch('dt.json').then(x=>x.json().then(dt=>{
    Object.keys(dt).forEach(k=>{
        dt
        kk=Object.keys(dt[k].tab)
        dt[k].tab.study.map((s,i)=>{
            let r={} // row as an object
            kk.forEach(ki=>{
                r[ki]=dt[k].tab[ki][i]
            })
            r.ageInt=parseInt(r.ageInt)
            confluence.coreData.push(r)
        })
        
    })
    // reduce reset

    


    // DC starts here
    let dd = confluence.coreData
    valUnique=function(k,v){
        var u={}
        dd.forEach(d=>{
            u[d[k]]=v
        })
        return u
    } 

    dc.config.defaultColors(d3.schemeCategory10)
    let cf=crossfilter(dd)

    // Status Pie Chard
    C_pieStatus = dc.pieChart("#pieStatus");
    let status = cf.dimension(function(d){return d.status});
    
    status_reduce=valUnique('status',0)
    count_study=valUnique('study',0)
    let G_status = status.group().reduce(
        // reduce in
        function(p,v){
            count_study[v.study]+=1
            status_reduce[v.status]+=1
            return status_reduce[v.status]
        },
        //reduce out
        function(p,v){
            count_study[v.study]-=1
            status_reduce[v.status]-=1
            return status_reduce[v.status]
        },
        // ini
        function(p){return 0}
    )
    

    //let G_status = status.group().reduceCount()
    
    C_pieStatus
        .width(350)
        .height(200)
        .radius(200)
        .innerRadius(60)
        .dimension(status)
        .group(G_status)
        .label(function(c){
            return `status=${c.key} (${c.value})`
         })
        //.colors(d3.scaleLinear().domain([-4,3,4]).range(['blue','cyan','gray']))
        .colors(d3.scaleOrdinal().domain(['0','1','2','3','4']).range(['#009688','orange','green','red','gray']))
        .colorAccessor(function(c,i){
            if(count_status[c.key]>0){
                return i
            }else{
                return 4
            }
        })

    // Study braChard
    let C_rowStudy = dc.rowChart("#rowStudy");
    let study = cf.dimension(function(d){return d.study});
    //let G_study = study.group().reduceCount()

    study_reduce=valUnique('study',0)
    count_status=valUnique('status',0)
    let G_study = study.group().reduce(
        // reduce in
        function(p,v){
            count_status[v.status]+=1
            study_reduce[v.study]+=1
            return study_reduce[v.study]
        },
        //reduce out
        function(p,v){
            count_status[v.status]-=1
            study_reduce[v.study]-=1
            return study_reduce[v.study]
        },
        // ini
        function(p){return 0}
    )
    

    //clickStatus = valUnique('status',true)
    C_rowStudy
     .width(450)
     .height(200)
     .dimension(study)
     .group(G_study)
     .elasticX(true)
     .colors(d3.scaleLinear().domain([-4,3,4]).range(['blue','cyan','gray']))
     .colorAccessor(function(c,i){
         //console.log(i)
         if(count_study[c.key]>0){
             return i
         }else{
             return 4
         }
         //debugger
     })
     .ordering(c=>-dt[c.key].tab.study.length)
     .label(function(c){
            return `${c.key} (${c.value})`
         })

     
     //.yAxisLabel('count')
     //

    let C_barAge = dc.barChart("#barAge");
    let age = cf.dimension(function(d){return d.ageInt});
    let G_age = age.group().reduceCount()

    C_barAge
     .width(500)
     .height(500)
     .dimension(age)
     .group(G_age)
     .x(d3.scaleLinear().domain([20,100]))
     .elasticY(true)
     .xAxisLabel('age')
     .yAxisLabel('count')

    dc.renderAll();
    C_pieStatus.render()

    CC={
        C_pieStatus:C_pieStatus,
        C_rowStudy:C_rowStudy,
        C_barAge:C_barAge
    }
}))
