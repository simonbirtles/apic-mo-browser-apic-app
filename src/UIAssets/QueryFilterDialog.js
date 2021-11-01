
/*
*   LICENSE
*   Copyright (c) 2015-2017, Simon Birtles http://linkedin.com/in/simonbirtles
*   All rights reserved.
*   Dual licensed under the MIT and GPL licenses.
*/

// move to class ***

// create the QueryFilterEdit dialog
var queryFilterEdit = d3.select("body")

    /**** Main Wrapper Window - Full Screen background to make modal****/
    .append("div")
    .attr("id", "queryModal")
    .classed("modal", true)

    /**** Content Wrapper for Header, Body, Footer ****/
    .append("div")
    .attr("id", "modal-content")
    .classed("modal-content", true)


    /**** Header ****/
    .append("div")
    .attr("id", "dialog-header")
    .classed("modal-header", true)

    /* close button */
    .append("span")
    .classed("close", true)
    .html("&times;")
    .on("click", function () {
        d3.select("div#queryModal").style("display", "none");
    })
    .select(function () { return this.parentNode; }) // div -> header

    /* dialog title */
    .append("text")
    .attr("id", "dialog-title")
    .text("dialog title")
    .select(function () { return this.parentNode; }) // div -> header   




    /**** Body ****/
    .select(function () { return this.parentNode; }) // div -> content
    .append("div")
    .attr("id", "dialog-body")
    .classed("modal-body", true)
    /* think this <p> can go and provide a div or use the current one to add content*/
    .append("text")
    .text("Some text in the Modal Body")
    .select(function () { return this.parentNode; }) // div -> body





    /**** Footer ****/
    .select(function () { return this.parentNode; }) // div -> content
    .append("div")
    .attr("id", "dialog-footer")
    .classed("modal-footer", true)
    .append("text")
    .text("")
    ;

setupDialogDrag();

// DRAGGER code for drag box (dragger div)
function setupDialogDrag() {
    var propContainer = d3.select("div#modal-content");
    var dragger = d3.select('div#dialog-header');

    dragger
        .call(d3.drag()
            .on("end",
                function () {
                    var dragger = d3.select('div#dialog-header');
                    dragger.attr("mx", 0)
                    dragger.attr("my", 0)
                })

            .on("start",
                function () {
                    var dragger = d3.select('div#dialog-header');
                    //console.log("start-x", d3.mouse(this.parentNode.parentNode.parentNode)[0]);
                    // console.log("start-y", d3.mouse(this.parentNode.parentNode.parentNode)[1]);
                    // console.log("start-dx", propContainer.node().getBoundingClientRect().left );

                    dragger.attr("mx", d3.mouse(this.parentNode.parentNode.parentNode)[0])
                    dragger.attr("my", d3.mouse(this.parentNode.parentNode.parentNode)[1])
                    dragger.attr("dx", propContainer.node().getBoundingClientRect().left)

                })

            .on('drag',
                function () {
                    g_x = d3.mouse(this.parentNode.parentNode.parentNode)[0];
                    g_y = d3.mouse(this.parentNode.parentNode.parentNode)[1];
                    if (g_x < 0) { return; }

                    var dragger = d3.select('div#dialog-header');
                    mx = dragger.attr("mx");
                    my = dragger.attr("my");

                    var calc = g_x - (mx - dragger.attr("dx"));
                    propContainer.style('left', Math.max(0, calc) + 'px');
                    propContainer.style('top', Math.max(0, g_y - 5) + 'px');

                    // console.log("g_x", g_x, "mx", mx, "dx", dragger.attr("dx"), "calc", calc);

                })
        );
}


function editQueryFilter(obj) {
    d3.select("#dialog-title").text("Edit Object Query String");
    d3.select("#dialog-body").selectAll('*').remove();

    var dBody = d3.select("#dialog-body") // is a div

    // main containing div
    var dData = dBody.append("div")

    /**** NODE DN ****/
    var tr = dData.append("table").append("tbody").append("tr");
    tr.append("td").classed("attribute", true).append("text").text("Node DN:");
    tr.append("td").classed("value", true).append("text").text(obj.dn);

    /**** Query String  ****/
    var tr = dData.append("table").append("tbody").append("tr");
    tr.append("td").classed("attribute", true).append("text").text("Query String:");
    tr.append("td").classed("value", true)
        .append("textarea")
        .attr("id", "query-text")
        .text(
            function () {
                if (obj.hasOwnProperty("defaultQueryFilter"))
                    return obj.defaultQueryFilter;
                return "";
            });


    d3.select("#dialog-footer").selectAll('*').remove();
    var footer = d3.select("#dialog-footer");

    /* SUBMIT button */
    footer.append("div")
        .classed("query-button", true)
        .on("click",
            function () {
                if (obj.hasOwnProperty("defaultQueryFilter")) {
                    obj.appdata.lastQueryFilter = obj.defaultQueryFilter;
                }
                obj.defaultQueryFilter = d3.select("textarea#query-text").property('value');
                obj.appdata.activeQueryFilter = d3.select("textarea#query-text").property('value');
                d3.select("div#queryModal").style("display", "none");
                getChildren(obj);
            })
        .append("text")
        .text("Submit");

    footer.append("div").classed("query-button-spacer", true)

    /* CANCEL button */
    footer.append("div")
        .classed("query-button", true)
        .on("click", function () {
            d3.select("div#queryModal").style("display", "none");
        })
        .append("text")
        .text("Cancel");

    footer.append("div").classed("query-button-spacer", true)

    /* RESET button */
    footer.append("div")
        .classed("query-button", true)
        .on("click", function () {
            if (obj.appdata.hasOwnProperty("defaultQueryFilter")) {
                document.getElementById('query-text').value = obj.appdata.defaultQueryFilter;
            }
        })
        .append("text")
        .text("Reset");

    // show the dialog - must do before setting left/top pos
    d3.select("div#queryModal").style("display", "block");

    // center the dialog
    var filterContentDiv = d3.select("div#modal-content");
    filterContentDiv.style("left",
        function () {
            // console.log((window.innerWidth / 2));
            // console.log(((filterContentDiv.node().getBoundingClientRect().width /2)) + 'px');
            return ((window.innerWidth / 2) - (filterContentDiv.node().getBoundingClientRect().width / 2)) + 'px';
        });
    filterContentDiv.style("top",
        function () {
            // console.log((window.innerHeight / 2));
            // console.log(((filterContentDiv.node().getBoundingClientRect().height /2)) + 'px');
            return ((window.innerHeight / 2) - (filterContentDiv.node().getBoundingClientRect().height / 2)) + 'px';
        });

    return;
}
