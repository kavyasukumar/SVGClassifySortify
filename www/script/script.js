var $data;
$(document).ready(function () {
    d3.json("./data/data.json", function (error, d) {
        $data = d;
        drawViz();
    });
});

function drawViz(){
	var $windowH = $(window).height();
    var $windowW = $('body').width();

    var $radius = 30,
        $vpadding =5;

    var margin = { top: 80, right: 20, bottom: 30, left: 50 },
    width =  $windowW*.5 - margin.left - margin.right,
    height = Math.max($windowH/3,500) - margin.top - margin.bottom;

    $radius= height/15; //todo: update this to max in a group 
    // add a svg canvas
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
        .attr("xlink:href",function(d){ return"./icons/"+d.gender +'.svg';})
        .attr('x',-$radius)
        .attr('y',-$radius)
        .attr("width", 2*$radius)
        .attr("height", 2*$radius);

    jurors.append('text')
        .attr('class','.label')
        .attr("text-anchor", "middle")
        .attr('fill','white')
        .attr('font-size',20)
        .attr('stroke','white')
    	.text(function(d){return d.no;});


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
               .attr('transform', function(d){return "translate("+linearScale(d[prop])+",30)";});


            addAxis(linearAxis);           

            //special casing the index    
            if(prop =="no"){
                removeAxis();
        }
    });

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
}