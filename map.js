async function getData() {
    const na = await d3.csv("covid_na.csv");
    const sa = await d3.csv("covid_sa.csv");
    const geo = await d3.json("americas.json");

    return [geo, na, sa];
}
function drawDynamicElements(svg, data) {
    drawMapFeatures(svg, data);
    drawToggleButtons(svg, data);
    drawTotalsChart(svg, data);
    drawCasesPerMil(data);
    drawCountryInfo(data);
}
////////////////////////////////////////////
function drawMap(data) {
    const width = 600;
    const height = 600;
    const case_changes = data[1].concat(data[2]).map(d => d["Weekly Case % Change"]);
    const changes_extent = d3.extent(case_changes);

    d3.select("#svg_map").remove();

    const svg_map  = d3.select("#map")
        .style("display", "inline-block")
        .style("padding", "5px")
        .append("svg")
        .attr("id", "svg_map")
        .attr("width", width)
        .attr("height", height)
        .style("background", "whitesmoke")

    const colour_axis = d3.axisRight(d3.scaleLinear().range([-100, 100]).domain(changes_extent.reverse()).nice())
        .ticks(3)
        .tickSize(10)
        .tickFormat(x => x+"%")

    drawDynamicElements(svg_map, data); 

    const defs = svg_map.append("defs")
    const gradient = defs.append("linearGradient")
        .attr("id", "linear-gradient")
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "darkgreen")
    gradient.append("stop")
        .attr("offset", "25%")
        .attr("stop-color", "green")
    gradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "white")
    gradient.append("stop")
        .attr("offset", "75%")
        .attr("stop-color", "red")
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "darkred")


    svg_map.append("text")
        .text("Projection: Azimuthal Equal Area")
        .attr("transform", "translate(" + [10, 17] + ")")
        .style("font-size", "0.7em")
        .style("font-style", "italic")
        .style("opacity", 0.7)
        .style("text-shadow", "0.5px 0.5px white")


    const legend = svg_map.append("g")
        .attr("transform", "translate(" + [10, height-300] + ")")

    legend.append("text")
        .attr("font-style", "italic")
        .attr("font-size", "0.9em")
        .text("% change in cases")
    
    legend.append("text")
        .attr("font-style", "italic")
        .attr("font-size", "0.8em")
        .text("Current vs. previous week")
        .attr("transform", "translate(" + [0,15] + ")")

    const scale = legend.append("g")
        .attr("transform", "translate(" + [10,220] + ")")
    
    scale.append("rect")
        .attr("width", 200)
        .attr("height", 10)
        .attr("transform", "translate(" + [0,10] + ") rotate(-90)")
        .style("fill", "url(#linear-gradient)")

    scale.append("g")
        .call(colour_axis)
        .attr("transform", "translate(" + [0,-90] + ")")

    scale.append("text")
        .attr("font-size", "0.6em")
        .text("(Increase)")
        .attr("transform", "translate(" + [40,-187] + ")")

    scale.append("text")
        .attr("font-size", "0.6em")
        .text("(Decrease)")
        .attr("transform", "translate(" + [43,12] + ")")
   
     
}
function drawToggleButtons(svg, data) {
    const width = svg.attr("width");
    const height = svg.attr("height");

    const toggleAll = svg.append("text")
        .text("See all")
        .attr("x", width - ((width/2)+10))
        .attr("y", height - 10)
        .on("click", () => {
            map_toggle = 0;
            drawDynamicElements(svg, data);
        })
        .attr("class", "toggle_button")

    const toggleNA = svg.append("text")
        .text("North America")
        .attr("x", 10)
        .attr("y", height - 10)
        .on("click", () => {
            map_toggle = 1;
            drawDynamicElements(svg, data);
        })
        .attr("class", "toggle_button")
    
    const toggleSA = svg.append("text")
        .text("South America")
        .attr("x", width - 105)
        .attr("y", height - 10)
        .on("click", () => {
            map_toggle = 2;
            drawDynamicElements(svg, data);
        })
        .attr("class", "toggle_button")

    const toggleButtons = [toggleAll, toggleNA, toggleSA];
    toggleButtons.forEach((button, toggle) => {
        if (map_toggle === toggle) {
            button
                .style("fill", "darkgoldenrod")
                .style("cursor", "text")
                .style("text-shadow", "1px 0px white")
        } else {
            button
                .style("fill", "blue")
                .style("cursor", "pointer")
                .style("text-shadow", "1px 0px white")
                .on("mouseover", (event) => {
                    d3.select(event.target).style("fill", "skyblue")
                })
                .on("mouseout", (event) => {
                    d3.select(event.target).style("fill", "blue")
                })
        }
    })
}
function drawMapFeatures(svg, data) {
    function redrawMapFeatures() {
        drawMapFeatures(svg, data);
    }
    function redrawCountryInfo() {
        drawCountryInfo(data);
    }
    function redrawCasesPerMil() {
        drawCasesPerMil(data);
    }

    const geo_json = data[0];
    const covid_data = data[1].concat(data[2]);

    svg.selectAll("#geoPath").remove();

    const proj = d3.geoAzimuthalEqualArea();
    switch(map_toggle) {
        case 0:
            proj
                .rotate([90,0])
                .scale(240)
                .translate([280, 10])
                .center([21.1619, 86.8515])
            break;
        case 1:
            proj
                .rotate([100,0])
                .scale(420)
                .translate([200, -20])
                .center([47.1164, 101.2996])
            break;
        case 2:
            proj
                .rotate([70,30])
                .scale(450)
                .translate([300, -60])
                .center([8.7832, 55.4915])
            break;
    }
    const geoGenerator = d3.geoPath().projection(proj);

    const case_changes = covid_data.map(d => d["Weekly Case % Change"]);
    const changes_extent = d3.extent(case_changes);
    const colour_scale = d3.scaleLinear()
        .domain([changes_extent[0], changes_extent[0]/2, 0, changes_extent[1]/2,changes_extent[1]])
        .range(["darkgreen", "green", "white", "red", "darkred"])
        .nice()

    svg.selectAll("path")
        .data(geo_json.features)
        .join("path")
        .attr("class", "geoPath")
        .style("stroke", d => d.properties.name === country_toggle ? "midnightblue" : "black")
        .style("stroke-width", d => d.properties.name === country_toggle ? "3px" : "0.5px")
        .style("transition", "all 0.2s")
        .attr("country", d => d.properties.name)
        .style("cursor", "pointer")
        .style("fill", d => {
            const country_data = covid_data.filter(c => c["Country/Other"] === d.properties.name)[0];
            if (typeof country_data !== "undefined") {
                return colour_scale(country_data["Weekly Case % Change"]);
            } else return "black";
        })
        .attr("d", geoGenerator)
        .attr("country", d => d.properties.name)
        .on("mouseover", (event) => {
            d3.select(event.target)
                .style("stroke-width", "2.5px")
        })
        .on("mouseout", (event) => {
            if (d3.select(event.target).attr("country") !== country_toggle) {
                d3.select(event.target)
                    .style("stroke-width", "0.5px")
            }
        })
        .on("click", (event) => {
            country_toggle = d3.select(event.target).attr("country");
            redrawMapFeatures();
            redrawCountryInfo();
            redrawCasesPerMil();
        })

    return;
}
function drawTotalsChart(svg, data) {
    let total_current;
    let total_preceding;
    const total_current_absolute = d3.sum(data[1].concat(data[2]).map(d => d["Cases in the last 7 days"]));
    const total_preceding_absolute = d3.sum(data[1].concat(data[2]).map(d => d["Cases in the preceding 7 days"]));
    switch(map_toggle) {
        case 0:
            total_current = total_current_absolute;
            total_preceding = total_preceding_absolute;
            break;
        case 1:
            total_current = d3.sum(data[1].map(d => d["Cases in the last 7 days"]));
            total_preceding = d3.sum(data[1].map(d => d["Cases in the preceding 7 days"]));
            break;
        case 2:
            total_current = d3.sum(data[2].map(d => d["Cases in the last 7 days"]));
            total_preceding = d3.sum(data[2].map(d => d["Cases in the preceding 7 days"]));
            break;
    }

    const totals = [total_preceding, total_current];
    const totals_absolute = [total_preceding_absolute, total_current_absolute];
    const totals_labels = ["Prec.", "Curr."];
    const totals_colours = ["grey", "purple"];

    const totals_x_scale = d3.scaleBand()
        .domain(totals_labels)
        .range([0, 80])
        .paddingInner(0.2)
        .paddingOuter(0.15)

    const totals_y_scale = d3.scaleLinear()
        .domain([0, d3.max(totals_absolute)])
        .range([100, 0])
        .nice()

    const totals_x_axis = d3.axisBottom(totals_x_scale);
    const totals_y_axis = d3.axisLeft(totals_y_scale)
        .ticks(5)
        .tickSize(3)
        .tickFormat(x => {
            const tick = x.toString();
            return tick.length > 3 ? tick.slice(0, -3) + "k" : "0";
        })


    svg.selectAll("#totals_chart").remove();

    const totals_chart = svg.append("g")
        .attr("transform", "translate(" + [svg.attr("width")-100, 40] + ")")
        .attr("id", "totals_chart")


    totals_chart.append("text")
        .text("Total Cases")
        .style("font-size", "0.9em")
        .attr("transform", "translate(" + [0, -23] + ")")

    totals_chart.append("text")
        .text("Preceding vs. Current week")
        .style("font-size", "0.7em")
        .attr("transform", "translate(" + [-30, -10] + ")")


    totals_chart.append("g").selectAll("rect")
        .data(totals_absolute)
        .enter()
        .append("rect")
            .attr("width", totals_x_scale.bandwidth())
            .attr("height", d => totals_y_scale(0) - totals_y_scale(d))
            .attr("x", (d,i) => totals_x_scale(totals_labels[i]))
            .attr("y", d => totals_y_scale(d))
            .style("fill", (d,i) => totals_colours[i])
    
    if (map_toggle !== 0) {
        totals_chart.append("g").selectAll("rect")
            .data(totals)
            .enter()
            .append("rect")
                .attr("width", totals_x_scale.bandwidth())
                .attr("height", d => totals_y_scale(0) - totals_y_scale(d))
                .attr("x", (d,i) => totals_x_scale(totals_labels[i]))
                .attr("y", d => totals_y_scale(d))
                .style("fill", (d,i) => "black")
                .style("fill-opacity", 0.4)
    }

    totals_chart.append("g")
       .call(totals_x_axis)
       .attr("transform", "translate(" + [0, 100] + ")")
       .style("text-shadow", "1px 1px white")

    totals_chart.append("g")
        .call(totals_y_axis)
        .style("text-shadow", "0.5px 0.5px white")
}
////////////////////////////////////////////
function drawCasesPerMil(data) {
    function redrawCasesPerMil() {
        drawCasesPerMil(data);
    }
    function redrawCountryInfo() {
        drawCountryInfo(data);
    }
    function redrawMap() {
        drawMap(data);
    }

    const width = 1000;
    const height = 600;

    let case_region;
    switch(map_toggle) {
        case 0:
            case_region = data[1].concat(data[2]);
            break;
        case 1:
            case_region = data[1];
            break;
        case 2:
            case_region = data[2];
            break;
    }

    const all_cases_per_mil = case_region.map(d => [d["Country/Other"], parseInt(d["Cases in the last 7 days/1M pop"])])
        .sort((a,b) => d3.descending(a[1], b[1]))  
    let cases_per_mil;
    switch(cases_per_mil_toggle) {
        case false:
            cases_per_mil = all_cases_per_mil.slice(0,5);
            break;
        case true:
            cases_per_mil = all_cases_per_mil.slice(-5);
            break;
    }
    
    const per_mil_extent = d3.extent(cases_per_mil.map(d => d[1]));

    const per_mil_x_scale = d3.scaleLinear()
        .domain([0, per_mil_extent[1]])
        .range([0, width-250])
        .nice()

    const per_mil_x_grid = d3.axisTop(per_mil_x_scale)
        .tickSize(height-150)

    const per_mil_y_scale = d3.scaleBand()
        .range([100, height-50])
        .domain(cases_per_mil.map(d => d[0]))
        .paddingInner(0.15)
        .paddingOuter(0.15)

    const per_mil_x_axis = d3.axisBottom(per_mil_x_scale);
    const per_mil_y_axis = d3.axisLeft(per_mil_y_scale);

    d3.selectAll("#svg_cases").remove();

    const svg_cases  = d3.select("#cases_mil")
        .style("display", "inline-block")
        .style("padding", "5px")
        .append("svg")
        .attr("id", "svg_cases")
        .attr("width", width)
        .attr("height", height)
        .style("background", "whitesmoke")

    svg_cases.append("g")
        .attr("transform", "translate(" + [150, height-50] +")")
        .call(per_mil_x_grid)  

    svg_cases.selectAll("path").style("display", "none")
    svg_cases.selectAll(".tick > line").style("opacity", 0.3)
    svg_cases.selectAll(".tick > text").style("display", "none")

    svg_cases.selectAll("rect")
        .data(cases_per_mil)
        .enter()
        .append("rect")
            .attr("width", d => per_mil_x_scale(d[1]))
            .attr("height", per_mil_y_scale.bandwidth())
            .style("transition", "all 0.2s")
            .style("stroke", "black")
            .style("stroke-width", "0px")
            .style("cursor", "pointer")
            .attr("country", d => d[0])
            .attr("x", 150)
            .attr("y", d => per_mil_y_scale(d[0]))
            .style("fill", d => d[0] === country_toggle ? "midnightblue" : "slategrey")
            .on("mouseover", (event) => {
                d3.select(event.target)
                    
                    .style("stroke-width", "2.5px")
            })
            .on("mouseout", (event) => {
                d3.select(event.target)
                    .style("stroke-width", "0px")
            })
            .on("click", (event) => {
                country_toggle = d3.select(event.target).attr("country");
                redrawCountryInfo();
                redrawCasesPerMil();
                redrawMap();
            })


    svg_cases.append("g")
        .attr("transform", "translate(" + [150, height-50] + ")")
        .call(per_mil_x_axis)

    svg_cases.append("g")
        .attr("transform", "translate(" + [150, 0] + ")")
        .call(per_mil_y_axis)

    svg_cases.append("text")
        .text("Cases in the last 7 days per 1M of population")
        .attr("transform", "translate(" + [(width/2)-75, height-15] + ")")
        .style("font-size", "0.9em")

    const title = svg_cases.append("text")
        .attr("transform", "translate(" + [20, 50] + ")")
        .style("font-size", "2em")

    switch(cases_per_mil_toggle) {
        case false:
            title.text("Regions with most cases per 1M people this week")
            break;
        case true:
            title.text("Regions with least cases per 1M people this week")
            break;
    }

    const subtitle = svg_cases.append("text")
        .attr("transform", "translate(" + [25, 75] + ")")
        .style("font-size", "1em")

    switch(map_toggle) {
        case 0:
            subtitle.text("Showing regions from all of the Americas")
            break;
        case 1:
            subtitle.text("Showing regions from North America")
            break;
        case 2:
            subtitle.text("Showing regions from South America")
            break;
    }
        

    const cases_per_mil_toggle_button = svg_cases.append("text")
        .style("fill", "blue")
        .style("cursor", "pointer")
        .on("mouseover", (event) => {
            d3.select(event.target).style("fill", "skyblue")
        })
        .on("mouseout", (event) => {
            d3.select(event.target).style("fill", "blue")
        })
        .on("click", (event) => {
            cases_per_mil_toggle = !cases_per_mil_toggle;
            redrawCasesPerMil();
        })

    switch(cases_per_mil_toggle) {
        case false:
            cases_per_mil_toggle_button
                .attr("transform", "translate(" + [width-250, 50] + ")")
                .text("Show regions with least cases")
            break;
        case true:
            cases_per_mil_toggle_button
                .attr("transform", "translate(" + [width-250, 50] + ")")
                .text("Show regions with most cases")
            break;
    }
}
////////////////////////////////////////////
function drawCountryInfo(data) {
    const country_data = data[1].concat(data[2]).filter(c => c["Country/Other"] === country_toggle)[0];

    const width = 1615;
    const height = 400;

    d3.selectAll("#svg_country").remove();

    const svg_country  = d3.select("#country")
        .style("display", "block")
        .style("padding", "5px")
        .append("svg")
        .attr("id", "svg_country")
        .attr("width", width)
        .attr("height", height)
        .style("background", "whitesmoke")

    svg_country.append("text")
        .text("Select a country by clicking on the map.")
        .attr("transform", "translate(" + [(width/2)-20, (height/2)+50] + ")")
        .style("text-anchor", "middle")
        .style("opacity", 0.5)
        .style("font-size", "0.8em")
        .style("font-style", "italic")

    const title = svg_country.append("g")
        .attr("transform", "translate(" + [(width/2)-50, (height/2)-50] + ")")
        .style("text-anchor", "middle")

    title.append("text")
        .text(country_toggle)
        .style("font-size", "3em")
        .attr("x", 25)
        .attr("y", 55)

    title.append("text")
        .text("Pop. " + parseInt(country_data["Population"]).toLocaleString())
        .style("font-size", "1em")
        .attr("x", 30)
        .attr("y", 80)


    drawCountryCases(svg_country, country_data);
    drawCountryCasesMil(svg_country, country_data);
    drawCountryDeaths(svg_country, country_data);
    drawCountryDeathsMil(svg_country, country_data);
        

}
function drawCountryCases(svg, country_data) {
    const country_cases = [parseInt(country_data["Cases in the preceding 7 days"]), parseInt(country_data["Cases in the last 7 days"])]
    const country_cases_labels = ["Preceding week", "Current week"];
    const country_cases_colours = ["grey", "hotpink"]

    const country_cases_x_scale = d3.scaleBand()
        .domain(country_cases_labels)
        .range([0, 200])
        .paddingInner(0.2)
        .paddingOuter(0.15)

    const country_cases_y_scale = d3.scaleLinear()
        .domain([0, d3.max(country_cases)])
        .range([200, 0])
        .nice()

    const country_cases_x_axis = d3.axisBottom(country_cases_x_scale);
    const country_cases_y_axis = d3.axisLeft(country_cases_y_scale)
        .ticks(3)

    const country_cases_chart = svg.append("g")
        .attr("transform", "translate(" + [100, 100] + ")")

    country_cases_chart.append("text")
        .text("Total Cases")
        .style("font-size", "1.2em")
        .attr("transform", "translate(" + [50, -40] + ")")

    country_cases_chart.append("text")
        .text(() => {
            const change =country_data["Weekly Case % Change"]
            if (change > 0) {
                return change + "% increase from preceding week"
            } else if (change < 0) {
                return Math.abs(change) + "% decrease from preceding week"
            } else {
                return "No change from preceding week"
            }
        })
        .style("font-size", "0.9em")
        .attr("transform", "translate(" + [0, -20] + ")")

    country_cases_chart.selectAll("rect")
        .data(country_cases)
        .enter()
        .append("rect")
            .attr("width", country_cases_x_scale.bandwidth())
            .attr("height", d => country_cases_y_scale(0) - country_cases_y_scale(d))
            .attr("x", (d,i) => country_cases_x_scale(country_cases_labels[i]))
            .attr("y", d => country_cases_y_scale(d))
            .style("fill", (d,i) => country_cases_colours[i])

    country_cases_chart.append("g")
        .call(country_cases_x_axis)
        .attr("transform", "translate(" + [0,200] + ")")

    country_cases_chart.append("g")
        .call(country_cases_y_axis)
        
}
function drawCountryDeaths(svg, country_data) {
    const country_deaths = [parseInt(country_data["Deaths in the preceding 7 days"]), parseInt(country_data["Deaths in the last 7 days"])]
    const country_deaths_labels = ["Preceding week", "Current week"];
    const country_deaths_colours = ["grey", "coral"];

    const country_deaths_x_scale = d3.scaleBand()
        .domain(country_deaths_labels)
        .range([0, 200])
        .paddingInner(0.2)
        .paddingOuter(0.15)

    const country_deaths_y_scale = d3.scaleLinear()
        .domain([0, d3.max(country_deaths)])
        .range([200, 0])
        .nice()

    const country_deaths_x_axis = d3.axisBottom(country_deaths_x_scale);
    const country_deaths_y_axis = d3.axisLeft(country_deaths_y_scale)
        .ticks(3)

    const country_deaths_chart = svg.append("g")
        .attr("transform", "translate(" + [svg.attr("width")-600, 100] + ")")

    country_deaths_chart.append("text")
        .text("Total Deaths")
        .style("font-size", "1.2em")
        .attr("transform", "translate(" + [50, -40] + ")")

    country_deaths_chart.append("text")
        .text(() => {
            const change =country_data["Weekly Death % Change"]
            if (change > 0) {
                return change + "% increase from preceding week"
            } else if (change < 0) {
                return Math.abs(change) + "% decrease from preceding week"
            } else {
                return "No change from preceding week"
            }
        })
        .style("font-size", "0.9em")
        .attr("transform", "translate(" + [0, -20] + ")")
    
    country_deaths_chart.selectAll("rect")
        .data(country_deaths)
        .enter()
        .append("rect")
            .attr("width", country_deaths_x_scale.bandwidth())
            .attr("height", d => country_deaths_y_scale(0) - country_deaths_y_scale(d))
            .attr("x", (d,i) => country_deaths_x_scale(country_deaths_labels[i]))
            .attr("y", d => country_deaths_y_scale(d))
            .style("fill", (d,i) => country_deaths_colours[i])

    country_deaths_chart.append("g")
        .call(country_deaths_x_axis)
        .attr("transform", "translate(" + [0,200] + ")")

    country_deaths_chart.append("g")
        .call(country_deaths_y_axis)
        
}
function drawCountryCasesMil(svg, country_data) {
    const country_cases_mil = country_data["Cases in the last 7 days/1M pop"];
    const pie_num = calcPieNum(country_data, "cases");
    const data = [parseInt(country_cases_mil), pie_num[0]-country_cases_mil];
    const pie_colours = ["hotpink", "grey"];

    const pie = d3.pie();
    const pie_data = pie(data);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(100)

    const country_cases_mil_pie = svg.append("g")
        .attr("transform", "translate(" + [450, 190] + ")")
    
    country_cases_mil_pie.selectAll("slices")
        .data(pie_data)
        .join("path")
        .attr("d", arc)
        .style("fill", (d,i) => pie_colours[i])
        .style("stroke", "black")
    

    country_cases_mil_pie.selectAll("slices")
        .data(pie_data)
        .join("text")
        .text((d,i) => i === 0 ? d.data : null)
        .attr("transform", d => {
            const centroid = arc.centroid(d);
            centroid[0] -= 5;
            return "translate(" + centroid + ")";
        })
        .style("text-anchor", "middle")
        .style("font-size", "0.9em")
        .style("text-shadow", "0.5px 0.5px white")
        .style("font-weight", "bold")
    
    const labels = country_cases_mil_pie.append("g")
        .style("text-anchor", "middle")

    labels.append("text")
        .text("Cases this week")
        .attr("transform", "translate(" + [0,-130] + ")")
        .style("font-size", "1.2em")
    
    labels.append("text")
        .text("Per 1 million people")
        .attr("transform", "translate(" + [0,-115] + ")")
        .style("font-size", "0.8em")

    labels.append("text")
        .text("1 circle = " + pie_num[0].toLocaleString() + " people")
        .attr("transform", "translate(" + [0,130] + ")")
        .style("font-size", "1em")
    
    labels.append("text")
        .text(pie_num[1].toLocaleString() + " circles = 1 million people")
        .attr("transform", "translate(" + [0,150] + ")")
        .style("font-size", "1em")
    
        labels.append("text")
        .text("~" + Math.round(pie_num[2]).toLocaleString() + " circles = total population")
        .attr("transform", "translate(" + [0,170] + ")")
        .style("font-size", "1em")

}
function drawCountryDeathsMil(svg, country_data) {
    const country_deaths_mil = country_data["Deaths in the last 7 days/1M pop"];
    const pie_num = calcPieNum(country_data, "deaths");
    const data = [parseInt(country_deaths_mil), pie_num[0]-country_deaths_mil];
    const pie_colours = ["coral", "grey"];

    const pie = d3.pie();
    const pie_data = pie(data);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(100)

    const country_deaths_mil_pie = svg.append("g")
        .attr("transform", "translate(" + [svg.attr("width")-250, 190] + ")")
    
    country_deaths_mil_pie.selectAll("slices")
        .data(pie_data)
        .join("path")
        .attr("d", arc)
        .style("fill", (d,i) => pie_colours[i])
        .style("stroke", "black")
    

    country_deaths_mil_pie.selectAll("slices")
        .data(pie_data)
        .join("text")
        .text((d,i) => i === 0 ? d.data : null)
        .attr("transform", d => {
            const centroid = arc.centroid(d);
            centroid[0] -= 5;
            return "translate(" + centroid + ")";
        })
        .style("text-anchor", "middle")
        .style("font-size", "0.9em")
        .style("text-shadow", "0.5px 0.5px white")
        .style("font-weight", "bold")
    
    const labels = country_deaths_mil_pie.append("g")
        .style("text-anchor", "middle")

    labels.append("text")
        .text("Deaths this week")
        .attr("transform", "translate(" + [0,-130] + ")")
        .style("font-size", "1.2em")
    
    labels.append("text")
        .text("Per 1 million people")
        .attr("transform", "translate(" + [0,-115] + ")")
        .style("font-size", "0.8em")

    labels.append("text")
        .text("1 circle = " + pie_num[0].toLocaleString() + " people")
        .attr("transform", "translate(" + [0,130] + ")")
        .style("font-size", "1em")
    
    labels.append("text")
        .text(pie_num[1].toLocaleString() + " circles = 1 million people")
        .attr("transform", "translate(" + [0,150] + ")")
        .style("font-size", "1em")
    
        labels.append("text")
        .text("~" + Math.round(pie_num[2]).toLocaleString() + " circles = total population")
        .attr("transform", "translate(" + [0,170] + ")")
        .style("font-size", "1em")
}
function calcPieNum(country_data, which) {
    let factors_1m = [1000,100,10];
    let i = 0;
    let pie_amt = 1000000/factors_1m[i];

    if (which === "cases") {
        pie_data = country_data["Cases in the last 7 days/1M pop"];
    } else if (which === "deaths") {
        pie_data = country_data["Deaths in the last 7 days/1M pop"];
    }

    while (i < factors_1m.length && pie_data*4 > pie_amt) {
        i += 1;
        pie_amt = 1000000/factors_1m[i];
    }

    
    return [pie_amt, factors_1m[i], country_data["Population"]/pie_amt]
}

var map_toggle = 0;
var cases_per_mil_toggle = false;
var country_toggle = "Canada";

getData()
.then(d => {
    drawMap(d);
});