/*
*   LICENSE
*   Copyright (c) 2015-2017, Simon Birtles http://linkedin.com/in/simonbirtles
*   All rights reserved.
*   Dual licensed under the MIT and GPL licenses.
*/

class ObjectProperties {

    constructor() {
        this.grabMargin = 10;
        this.bDragging = false;
        this.bMousedown = false;
        this.createDialogBase()
        this.setupObjPropWinDrag()


        // Dialog Title
        d3.select("#obj-prop-title").text("Properties");

        // Dialog Body
        d3.select("#obj-prop-body").selectAll('*').remove();  // cleanup from last display of data
        var dBody = d3.select("#obj-prop-body") // is a div

        // append a new main containing div
        var dData = dBody.append("div").style("overflow", "none").style("display", "block");

        d3.select("#obj-prop-content").style("height", (window.innerHeight * 0.60) + "px")
    }


    createDialogBase() {
        var objectPropWin = d3.select("body")

            /**** Content Wrapper for Header, Body, Footer ****/
            .append("div")
            .attr("id", "obj-prop-content")
            .classed("obj-prop-content", true)

            /**** Header ****/
            .append("div")
            .attr("id", "obj-prop-header")
            .classed("obj-prop-header", true)

            /* close button */
            .append("span")
            .classed("close", true)
            .html("&times;")
            .on("click", function () {
                d3.select('input#toggleProp').property('checked', false);
                showProperties();
            })
            .select(function () { return this.parentNode; }) // div -> header

            /* dialog title */
            .append("text")
            .attr("id", "obj-prop-title")
            .text("dialog title")
            .select(function () { return this.parentNode; }) // div -> header   

            /**** Body ****/
            .select(function () { return this.parentNode; }) // div -> content
            .append("div")
            .attr("id", "obj-prop-body")
            .classed("obj-prop-body", true)
            .append("text")
            .text("Some text in the Modal Body")
            .select(function () { return this.parentNode; }) // div -> body

            /**** Footer ****/
            .select(function () { return this.parentNode; }) // div -> content
            .append("div")
            .attr("id", "obj-prop-footer")
            .call(d3.drag()
                .on("start", this.dragstarted.bind(this))
                .on("drag", this.dragging.bind(this))
                .on("end", this.dragended.bind(this)))
            .on("mousemove", this.mousemove.bind(this))
            //.on("mousedown", this.mousedown.bind(this))
            //.on("mouseup",   this.mouseup.bind(this))

            .classed("obj-prop-footer", true)
            .append("text")
            .text("");

    }

    ///////////////////////////////////////////////////////////////////////////////
    // DRAGGER code for drag box (dragger div)
    ///////////////////////////////////////////////////////////////////////////////
    setupObjPropWinDrag() {
        var propContainer = d3.select("div#obj-prop-content");
        var dragger = d3.select('div#obj-prop-header');

        dragger
            .call(d3.drag()
                .on("end",
                    function () {
                        var dragger = d3.select('div#obj-prop-header');
                        dragger.attr("mx", 0)
                        dragger.attr("my", 0)
                    })

                .on("start",
                    function () {
                        var dragger = d3.select('div#obj-prop-header');
                        dragger.attr("mx", d3.mouse(this.parentNode.parentNode.parentNode)[0])
                        dragger.attr("my", d3.mouse(this.parentNode.parentNode.parentNode)[1])
                        dragger.attr("dx", propContainer.node().getBoundingClientRect().left)
                    })

                .on('drag',
                    function () {
                        var g_x = d3.mouse(this.parentNode.parentNode.parentNode)[0];
                        var g_y = d3.mouse(this.parentNode.parentNode.parentNode)[1];
                        if (g_x < 0) { return; }

                        var dragger = d3.select('div#obj-prop-header');
                        var mx = dragger.attr("mx");
                        var my = dragger.attr("my");

                        var calc = g_x - (mx - dragger.attr("dx"));
                        propContainer.style('left', Math.max(0, calc) + 'px');
                        propContainer.style('top', Math.max(0, g_y - 5) + 'px');
                    })
            );
    }


    updateNodeProperties(node) {
        // Dialog Title
        d3.select("#obj-prop-title").text(node.label.split("(")[1].split(")")[0] + " [" + node.absclassname + "]");

        // Dialog Body
        d3.select("#obj-prop-body").selectAll('*').remove();  // cleanup from last display of data
        var dBody = d3.select("#obj-prop-body") // is a div

        // append a new main containing div
        var dData = dBody.append("div").style("overflow", "none").style("display", "block");

        // create table / row for each attribute
        var tbody = dData.append("table").style("table-layout", "fixed").append("tbody");

        // class cisco.com MIM link
        var tr = tbody.append("tr");
        tr.append("td").classed("obj-prop-attribute", true).append("text").text("MIM link:");
        tr.append("td").classed("obj-prop-value", true)
            .append("a")
            .attr("href", "https://pubhub-prod.s3-us-west-2.amazonaws.com/media/apic-mim-ref/docs/MO-" + node.absclassname + ".html")
            .attr("title", "ctrl-click")
            .attr("target", "_blank")
            .html(node.absclassname);

        for (var prop in node.data) {
            if (node.data.hasOwnProperty(prop)) {
                var tr = tbody.append("tr");
                tr.append("td").classed("obj-prop-attribute", true).append("text").text(prop + ":");
                tr.append("td").classed("obj-prop-value", true).append("text").text(node.data[prop]);
            }
        }
        return;
    }


    showWindow(bShow) {
        var propContainer = d3.select("div#obj-prop-content");
        propContainer
            .transition()
            .duration(500)
            .style("opacity", (bNodePropShown ? 1 : 0))
            .style("visibility", (bNodePropShown ? "visible" : "hidden"))
    }


    mousemove() {
        var nDiv = d3.select("div#obj-prop-footer").node();
        var width = parseInt(d3.select("div#obj-prop-footer").style("width"));
        var height = parseInt(d3.select("div#obj-prop-footer").style("height"));

        if (//(d3.mouse(nDiv)[0] > width-this.grabMargin) && (d3.mouse(nDiv)[0] < width+this.grabMargin) &&
            (d3.mouse(nDiv)[1] > height - this.grabMargin) && (d3.mouse(nDiv)[1] < height + this.grabMargin)) {
            d3.select("div#obj-prop-footer").style("cursor", "ns-resize");
        }
        else {
            d3.select("div#obj-prop-footer").style("cursor", "default");
        }
    }


    dragstarted() {

    }

    dragended() {

    }

    dragging() {
        var nDiv = d3.select("div#obj-prop-content").node();
        var g = d3.select("body").node();
        console.log("ondrag x,y= ", d3.mouse(g)[0]);

        var prop = d3.select("div#obj-prop-content").node();
        var r = prop.getBoundingClientRect();

        // get top, left of prop box in global co-ords
        var top = r.y;
        var left = r.x;
        // get mouse pos in global and use global top, left - global mouse x,y = prop width,height
        height = Math.max(d3.mouse(g)[1] - top, 100);
        width = Math.max(d3.mouse(g)[0] - left, 300);

        d3.select("div#obj-prop-content").style("height", 2 + height + 'px');
        // d3.select("div#obj-prop-content").style("width", width+'px');
    }

} // class ObjectProperties

