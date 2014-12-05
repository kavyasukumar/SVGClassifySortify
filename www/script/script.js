var $data;
var currentSelection = {'type':'linear', 'prop':'no'};
$(document).ready(function () {
    d3.json("http://apps.mypalmbeachpost.com/interactives/goodmanjurors/data/data.json", function (error, d) {
        $data = d;
        drawViz();
    });
    $(window).resize(function(){
        drawViz();
    });
});

function drawViz(){    
	var $windowH = $(window).height();
    var $windowW = $('#fakebody').width();

    var $radius = 30,
        $vpadding =5;

    var flip = false;

    var margin = { top: 80, right: 20, bottom: 30, left: 50 };
    if($windowW < 680)
    {    
        flip = true;
        margin = { top: 40, right: 0, bottom: 0, left: 70 };
    }
    
    var width =  $windowW - margin.left - margin.right-10,
    height = Math.max($windowH,600) - margin.top - margin.bottom;
    //height = $('#sortselectors').height() - margin.top - margin.bottom;

    $radius= Math.min(width/14,height/24); 
    // add a svg canvas

    d3.select("#viz").select("svg").remove();
    //updateSelectionStyle($('#no'));

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

    if(flip){
        linearAxis.orient("left");
        ordinalAxis.orient("left");
        ordinalScale.rangePoints([0,height*2/3-2*$radius],.1);
        linearScale.range([0,height-2*$radius]);
    }

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
            var x = ordinalScale(propValue);            
            var currentindex = countArr[propValue]            
            var y = $radius + 2*currentindex*($radius+$vpadding);

            if(currentindex>4){
                var currentindex = countArr[propValue]%5;
                x = x + 2*$radius;
                y = $radius + 2*(currentindex)*($radius+$vpadding);
            }
            if(flip){
                return "translate("+y+","+x+")";
            }
            return "translate("+x+","+y+")";
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
        .attr('class','juror');

    if(currentSelection.type == 'linear'){
        linearTransformer(currentSelection.prop);
    }
    else{
        ordinalTransformer(currentSelection.prop);
    }



    jurors.append('image')
        .attr("xlink:href",function(d){ 
            return"http://apps.mypalmbeachpost.com/interactives/goodmanjurors/icons/"+ (d.type=="Main"?"":"gray")+d.gender +'.svg';
        })
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
    	.text(function(d){return d.no;});


    function linearTransformer(prop){
        //set up linear axis
            linearScale.domain([1,d3.max($data, function (d) { return d[prop]; })]);

            // animate transition 
            svg.selectAll('.juror')
               .transition()
               .duration(800)
               .delay(delayFx)
               .attr('transform', function(d,i){
                if(flip){
                    return "translate(30,"+linearScale(d[prop])+")"
                }
                return "translate("+linearScale(d[prop])+",30)";
            });

            addAxis(linearAxis);


            //set currents election in case of resize            
            currentSelection.type ='linear';
            currentSelection.prop = prop;   


            //special casing the index    
            if(prop =="no"){
                removeAxis();
        }
    }
    // sort behavior
    d3.selectAll('.selector.linear')
    	.on('click', function(){
           updateSelectionStyle(d3.event.target);           
            linearTransformer(d3.event.target.id);            
    });

    function ordinalTransformer(prop){
        //set up axis
            ordinalScale.domain($data.sort(function(a,b){ return d3.ascending(a[prop],b[prop])})
                .map(function (d){ return d[prop];}));
            addAxis(ordinalAxis);

            //now calculate transforms and animate transition
            countArr = {};
            svg.selectAll('.juror')         
              .transition()
               .duration(800)
               .delay(delayFx)
              .attr('transform', function(d){ return getTransform(d[prop]);});


            //set currents election in case of resize            
            currentSelection.type ='ordinal';
            currentSelection.prop = prop; 
    }

    // group behavior
    d3.selectAll('.selector.ordinal')
    	.on('click', function(){
            updateSelectionStyle(d3.event.target);

            ordinalTransformer(d3.event.target.id); //get the property name to sort by

            
        });

    // show modal on clicking juror
    d3.selectAll('.juror')
    .on('click', function(){            
        d3.select('.mymodal #content').remove();
        
        var contentDiv = d3.select('.mymodal')
        .append('div')
        .attr('id','content');

        contentDiv.append('img')
            .classed('profile', true)
            .attr('src',d3.event.target.href.baseVal);

        contentDiv.append('div')
            .classed('props',true)
            .html(function(d){
                var propset = d3.event.target.__data__;

                var html ="<span id=\"modaljurorno\"> <b>Juror #"+propset.no+"</b></span>"
                    +"<span id=\"modalcity\"><b> City</b>: "+propset.city+"</span>"
                    +"<span id=\"modalgender\"><b> Gender</b>: "+propset.gender+"</span>"
                    +"<span id=\"modalrace\"><b> Race</b>: "+propset.race+"</span>"                    
                    +"<span id=\"modaloccupation\"><b> Occupation</b>: "+propset.occupation+"</span>"
                    +"<span id=\"modalmarital\"><b> Marital status</b>: "+propset.marital+"</span>"
                    +"<span id=\"modalchildren\"><b> No. of children</b>: "+propset.children+"</span><br/>"
                    +"<span id=\"modalfunfact\">"+propset.funfact+"</span><br/>";
                    return html;
            });

        d3.select('.mymodal')
        .classed('show',true);
    })

    //close modal window
    d3.select('#closeBtn')
    .on('click', function(){
        d3.select('.mymodal')
        .classed('show',false);
    })
}