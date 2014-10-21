var $data;
$(document).ready(function () {
    d3.json("./data/data.json", function (error, d) {
        $data = d;
        drawViz();
    });
    $(window).resize(drawViz);
});

function drawViz(){
	var $windowH = $(window).height();
    var $windowW = $('body').width();

    var $radius = 30,
        $vpadding =5;

    var margin = { top: 80, right: 20, bottom: 30, left: 50 };
    if($windowW < 481)
    {    
        margin = { top: 40, right: 0, bottom: 0, left: 20 };
    }
    
    var width =  $windowW,// - margin.left - margin.right-10,
    height = Math.max($windowH,500) - margin.top - margin.bottom;
    //height = $('#sortselectors').height() - margin.top - margin.bottom;

    $radius= Math.min(width/18,height/18); //todo: update this to max in a group 
    // add a svg canvas

    d3.select("#viz").select("svg").remove();

    var svg = d3.select("#viz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");      

    //scales and axes
    var linearScale = d3.scale.linear()
       .range([0,width-2*$radius]);

    var linearAxis = d3.svg.axis()
        .scale(linearScale)
        .orient("top");

    var ordinalScale = d3.scale.ordinal()
       .rangePoints([0,width-2*$radius],.1);

    var ordinalAxis = d3.svg.axis()
        .scale(ordinalScale)
        .orient("top");

    var addAxis = function(axis){ 
        removeAxis();
        
        svg.append("g")
            .attr("class", "axis")
            .call(axis);
    }
    var removeAxis = function(){
        d3.select('.axis').remove();
    }

    // calculate transform for ordinal axis
    var getTransform = function(propValue){
            countArr[propValue] = countArr[propValue]==undefined ? 0 : countArr[propValue]+1;
            var y = $radius + 2*countArr[propValue]*($radius+$vpadding);
            return "translate("+ordinalScale(propValue)+","+y+")";
        }

    var delayFx = function(d,i){
        return i%($data.length/2)*40;
    }

    var updateSelectionStyle =function(element){
         d3.selectAll('.selector').classed('selected',false);
         d3.select(element).classed('selected', true);
    }

    //default scale is by juror number
    linearScale.domain([1,d3.max($data, function (d) { return d.no; })]);

    // put in those people and text
    var jurors = svg.selectAll('.juror')
    	.data($data)
    .enter().append('g')        
        .attr('class','juror')
        .attr('transform', function(d){return "translate("+linearScale(d.no)+",30)";});

    jurors.append('image')
        .attr("xlink:href",function(d){ return"./icons/"+ (d.type=="Main"?"":"gray")+d.gender +'.svg';})
        .attr('x',-$radius)
        .attr('y',-$radius)
        .attr("width", 2*$radius)
        .attr("height", 2*$radius);

    jurors.append('text')
        .attr('class','.label')
        .attr("text-anchor", "middle")
        .attr('fill','white')
        .attr('font-size',$radius/2)
        .attr('stroke','white')
    	.text(function(d){return d.originalno;});


    // sort behavior
    d3.selectAll('.selector.linear')
    	.on('click', function(){

           updateSelectionStyle(d3.event.target);

            var prop = d3.event.target.id; //get the property name to sort by

            //set up linear axis
            linearScale.domain([1,d3.max($data, function (d) { return d[prop]; })]);

            // animate transition 
    		svg.selectAll('.juror')
    		   .transition()
               .duration(800)
               .delay(delayFx)
               .attr('transform', function(d,i){return "translate("+linearScale(d[prop])+",30)";});


            addAxis(linearAxis);           

            //special casing the index    
            if(prop =="no"){
                removeAxis();
        }
    });

    // group behavior
    d3.selectAll('.selector.ordinal')
    	.on('click', function(){
            updateSelectionStyle(d3.event.target);

            var prop = d3.event.target.id; //get the property name to sort by

            //set up axis
            ordinalScale.domain($data.map(function (d){ return d[prop];}));
            addAxis(ordinalAxis);

            //now calculate transforms and animate transition
            countArr = {};
    		svg.selectAll('.juror')    		
    		  .transition()
               .duration(800)
               .delay(delayFx)
              .attr('transform', function(d){ return getTransform(d[prop]);});
    	});

    // show modal on clicking juror
    d3.selectAll('.juror')
    .on('click', function(){            
        d3.select('.modal #content').remove();
        
        var contentDiv = d3.select('.modal')
        .append('div')
        .attr('id','content');

        contentDiv.append('img')
            .classed('profile', true)
            .attr('src',d3.event.target.href.baseVal);

        var getPronoun = function (gender){
            return gender=="Female"?"She":(gender=="Male"?"He":null);
        }

        contentDiv.append('div')
            .classed('props',true)
            .html(function(d){
                var propset = d3.event.target.__data__;

                var html ="<span id=\"modaljurorno\"> <b>Juror #"+propset.originalno+"</b></span>"
                    +"<span id=\"modalcity\"><b> City</b>: "+propset.city+"</span>"
                    +"<span id=\"modalgender\"><b> Gender</b>: "+propset.gender+"</span>"
                    +"<span id=\"modalrace\"><b> Race</b>: "+propset.race+"</span>"
                    +"<span id=\"modalmarital\"><b> Marital status</b>: "+propset.marital+"</span>"
                    +"<span id=\"modaloccupation\"><b> Occupation</b>: "+propset.occupation+"</span><br/>"
                    +"<span id=\"modalfunfact\">"+propset.funfact+"</span><br/>";

                   /* +"<span>" + getPronoun(propset.gender) + " has "+(propset.priorjury == "No"?"never":"")+" served on a jury before this trial.</span>"
                    +"<span>" + getPronoun(propset.gender) + " has "+(propset.lawenforcement == "No"?"never":"")+" worked in law enforcement.</span>"
                    +"<span>" + getPronoun(propset.gender) + " has "+(propset.witness == "No"?"never":"")+" been a witness to a crime.</span>"
                    +"<span>" + getPronoun(propset.gender) + " has "+(propset.victim == "No"?"never":"")+" been a victim of a crime.</span>"
                    +"<span>" + getPronoun(propset.gender) + " has "+(propset.arrested == "No"?"never":"")+" been arrested.</span>"
                    +"<span>" + getPronoun(propset.gender) + " has "+(propset.lawsuit == "No"?"never":"")+" been involved in a lawsuit.</span>"
                    +"<span>" + getPronoun(propset.gender) + " has "+(propset.claims == "No"?"never":"")+" filed claims for personal injury.</span>"*/
                    return html;
            });



       /* contentDiv.selectAll('div')
            .data(d3.entries(d3.event.target.__data__))
            .enter().append('div')
            .html(function(d){
                if(propmap[d.key] != undefined)
                {
                    var key = propmap[d.key];
                }
                return '<span class="key">'+d.key+'</span>:&nbsp;' +'<span>'+d.value+'<\span>';
            });*/

        d3.select('.modal')
        .classed('show',true);
    })

    //close modal window
    d3.select('#closeBtn')
    .on('click', function(){
        d3.select('.modal')
        .classed('show',false);
    })
}