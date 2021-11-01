/*
*   LICENSE
*   Copyright (c) 2015-2017, Simon Birtles http://linkedin.com/in/simonbirtles
*   All rights reserved.
*   Dual licensed under the MIT and GPL licenses.
*/

class AppMessages {
    constructor() {
        this.createDialogBase();
        this.createDragActions();
        this.setupMessageWindow();
    }

    createDialogBase() {

        var appMessagesWin = d3.select("body")

            /**** Content Wrapper for Header, Body, Footer ****/
            .append("div")
            .attr("id", "app-msg-content")
            .classed("app-msg-content", true)


            /**** Header ****/
            .append("div")
            .attr("id", "app-msg-header")
            .classed("app-msg-header", true)

            /* close button */
            .append("span")
            .classed("close", true)
            .html("&times;")
            .on("click", function () {
                d3.select('input#toggleProp').property('checked', false);
                showMessageWindow();
            })
            .select(function () { return this.parentNode; }) // div -> header

            /* dialog title */
            .append("text")
            .attr("id", "app-msg-title")
            .text("dialog title")
            .select(function () { return this.parentNode; }) // div -> header   


            /**** Body ****/
            .select(function () { return this.parentNode; }) // div -> content
            .append("div")
            .attr("id", "app-msg-body")
            .classed("app-msg-body", true)
            .append("text")
            .text("Some text in the Modal Body")
            .select(function () { return this.parentNode; }) // div -> body


            /**** Footer ****/
            .select(function () { return this.parentNode; }) // div -> content
            .append("div")
            .attr("id", "app-msg-footer")
            .classed("app-msg-footer", true)
            .append("text")
            .text("");

    }

    // DRAGGER code for drag box (dragger div)
    createDragActions() {
        var propContainer = d3.select("div#app-msg-content");
        var dragger = d3.select('div#app-msg-header');

        dragger
            .call(d3.drag()
                .on("end",
                    function () {
                        var dragger = d3.select('div#app-msg-header');
                        dragger.attr("mx", 0)
                        dragger.attr("my", 0)
                    })

                .on("start",
                    function () {
                        var dragger = d3.select('div#app-msg-header');
                        //console.log("start-x", d3.mouse(this.parentNode.parentNode.parentNode)[0]);
                        // console.log("start-y", d3.mouse(this.parentNode.parentNode.parentNode)[1]);
                        // console.log("start-dx", propContainer.node().getBoundingClientRect().left );

                        dragger.attr("mx", d3.mouse(this.parentNode.parentNode.parentNode)[0])
                        dragger.attr("my", d3.mouse(this.parentNode.parentNode.parentNode)[1])
                        dragger.attr("dx", propContainer.node().getBoundingClientRect().left)

                    })

                .on('drag',
                    function () {
                        var g_x = d3.mouse(this.parentNode.parentNode.parentNode)[0];
                        var g_y = d3.mouse(this.parentNode.parentNode.parentNode)[1];
                        if (g_x < 0) { return; }

                        var dragger = d3.select('div#app-msg-header');
                        var mx = dragger.attr("mx");
                        var my = dragger.attr("my");

                        var calc = g_x - (mx - dragger.attr("dx"));
                        propContainer.style('left', Math.max(0, calc) + 'px');
                        propContainer.style('top', Math.max(0, g_y - 5) + 'px');

                        // console.log("g_x", g_x, "mx", mx, "dx", dragger.attr("dx"), "calc", calc);

                    })
            );
    }

    setupMessageWindow() {
        // Dialog Title (header)
        //////////////////////////////////////////////////////////    
        d3.select("#app-msg-title").text("Application Messages");


        // Dialog Body
        //////////////////////////////////////////////////////////        
        d3.select("#app-msg-body").selectAll('*').remove();  // cleanup from last display of data
        var dBody = d3.select("#app-msg-body") // is a div

        // append a new main containing div
        var outerContainer = dBody.append("div").classed("app-msg-container", true);

        // div to contain all messages
        var msgContainer = outerContainer.append("div")
            .attr("id", "app-msg-msg-container")
            .classed("app-msg-msg-container", true);


        // test messages

        d3.select("div#app-msg-msg-container").append("div")
            .classed("app-msg-msg", true)
            .append("p").style("margin", "0 auto")
            .text("App Start up...");



        // footer 
        //////////////////////////////////////////////////////////
        d3.select("#app-msg-footer").selectAll('*').remove();
        var footer = d3.select("#app-msg-footer");

        /* clear button */
        footer.append("div")
            .classed("query-button", true)
            .on("click",
                function () {
                    d3.select("div#app-msg-msg-container").selectAll('*').remove();
                    this.postMessage("Messages Cleared");
                }.bind(this))
            .append("text")
            .text("Clear");

        footer.append("div").classed("query-button-spacer", true)

        return;
    }

    // post a message to the msg window
    postMessage(msg, errorMsgClass) {
        console.log("true= ", parseInt(true));
        var txtColor = "black";

        if (errorMsgClass === true) { txtColor = "red"; }

        if (errorMsgClass === "error") { txtColor = "red"; }
        if (errorMsgClass === "info") { txtColor = "blue"; }
        if (errorMsgClass === "warning") { txtColor = "magenta"; }
        if (errorMsgClass === "normal") { txtColor = "black"; }


        d3.select("div#app-msg-msg-container")
            .append("div")
            .classed("app-msg-msg", true)
            .append("html")
            .classed(errorMsgClass, true)
            .style("margin", "0 auto")
            .style("color", txtColor)
            .html(msg);


        var element = document.getElementById("app-msg-msg-container");
        element.scrollTop = element.scrollHeight;

        return;
    }


} // class AppMessages

