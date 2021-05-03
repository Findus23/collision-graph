import * as d3 from "d3";

import data from "./longtime_test_updated.extra.json"

window.data = data


const solar_massroot = Math.cbrt(1e26)
const mean_mass = Math.cbrt(1.2505002076124567e+23)

function mass_to_radius(massroot) {
    if (massroot > solar_massroot) {
        return 100
    } else {
        return 10 * massroot / mean_mass
    }

}
let connections = []


let planet_list = Object.keys(data.pdata).map(key => {
    const pdata = data.pdata[key]
    let massroot = Math.cbrt(pdata.total_mass)
    let radius = mass_to_radius(massroot)

    if (pdata.collided_with_sun) {
        connections.push({
            source: key,
            target: "1"
        })
    }

    return (
        {id: key.toString(), pdata: pdata, radius}
    );
});

// const average_mass = masses.reduce((p, c) => p + c, 0) / masses.length

for (let child in data.tree) {
    if (data.tree.hasOwnProperty(child)) {
        let parents = data.tree[child].parents
        let meta = data.tree[child].meta
        parents.forEach(parent => {
            connections.push({
                source: parent.toString(),
                target: child.toString()
            })
        })
    }
}




console.info(planet_list)
console.info(connections)

const lineColor = "#b6b6b6"


export function tree() {
    const width = window.innerWidth
    const height = window.innerHeight


    const svg = d3.select("body").append("svg")
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom()
            .extent([[0, 0], [width, height]])
            .scaleExtent([0.3, 8])
            .on("zoom", zoomed));

    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -0.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", lineColor)
        .attr("d", "M0,-5L10,0L0,5");


    const g = svg.append("g");

    function zoomed({transform}) {
        g.attr("transform", transform);
    }

    // create a tooltip
    var Tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")

    function mouseover(event, node) {
        Tooltip
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", "red")
            .style("opacity", 1)
    }

    function mousemove(event, node) {
        Tooltip
            .text("WMF: " + node.pdata.water_mass_fraction)
            .style("left", event.clientX + 20 + "px")
            .style("top", event.clientY + 20 + "px")
    }

    function mouseleave(event, node) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "blue")
            .style("opacity", undefined)
    }


    const simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX().strength(0.02))
        .force("y", d3.forceY().strength(0.02));


    window.simulation = simulation


    window.nodes = simulation.nodes(planet_list)

    function getNodeColor(node) {
        if (node.pdata.escaped) {
            return "#ff9999"
        }
        if (node.pdata.collided_with_sun) {
            return "#ffe999"
        }
        switch (node.pdata.type) {
            case "sun":
                return "yellow"
            case "gas giant":
                return "lightgray"
            case "embryo":
                return "lightgreen"
            case "planetesimal":
                return "lightblue"
            default:
                return "red"
        }
    }

    const nodeElements = g.append('g')
        .selectAll('circle')
        .data(planet_list)
        .enter().append('circle')
        .attr('r', node => node.radius)
        .attr('fill', getNodeColor)
        .attr('id', node => node.id)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    simulation.force('link', d3.forceLink(connections)
        .id(link => link.id)
        .strength(1.8))
    // .distance(30)

    const linkElements = g.append('g')
        .selectAll('line')
        .data(connections)
        .enter().append('line')
        .attr('stroke-width', 1)
        .attr('stroke', lineColor)
        .attr("marker-start", "url(#arrow)")


    simulation.on("tick", () => {
        nodeElements
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
        linkElements
            .attr('x1', link => link.source.x)
            .attr('y1', link => link.source.y)
            .attr('x2', link => link.target.x)
            .attr('y2', link => link.target.y)
    })

    const dragDrop = d3.drag()
        .on('start', (event, d) => {
            if (!event.active) {
                simulation.alphaTarget(0.3).restart();
            }
            d.fx = d.x
            d.fy = d.y
        })
        .on('drag', (event, d) => {
            simulation.alphaTarget(0.7).restart()
            d.fx = event.x
            d.fy = event.y
        })
        .on('end', (event, d) => {
            if (!event.active) {
                simulation.alphaTarget(0)
            }
            d.fx = null
            d.fy = null
        })

    nodeElements.call(dragDrop)


}
