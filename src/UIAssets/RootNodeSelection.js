
/*
*   LICENSE
*   Copyright (c) 2015-2017, Simon Birtles http://linkedin.com/in/simonbirtles
*   All rights reserved.
*   Dual licensed under the MIT and GPL licenses.
*/

class ChangeRoot {
    constructor() {
        this.createDialogBase();
        this.createDragActions();
    }

    createDialogBase() {
        // declare basic JSON 
        this.jsonAbsClasses = [];

        // create the Object Properties Dialog
        this.objectPropWin = d3.select("body")

            .append("div")
            .attr("id", "root-node-modal-window")
            .classed("modal", true)

            /**** Content Wrapper for Header, Body, Footer ****/
            .append("div")
            .attr("id", "root-node-content")
            .classed("root-node-content", true)


            /**** Header ****/
            .append("div")
            .attr("id", "root-node-header")
            .classed("root-node-header", true)

            /* close button */
            .append("span")
            .classed("close", true)
            .html("&times;")
            .on("click", function () {
                d3.select("div#root-node-modal-window").style("display", "none");
            })
            .select(function () { return this.parentNode; }) // div -> header

            /* dialog title */
            .append("text")
            .attr("id", "root-node-title")
            .text("dialog title")
            .select(function () { return this.parentNode; }) // div -> header   



            /**** Body ****/
            .select(function () { return this.parentNode; }) // div -> content
            .append("div")
            .attr("id", "root-node-body")
            .classed("root-node-body", true)
            /* think this <p> can go and provide a div or use the current one to add content*/
            .append("text")
            .text("Some text in the Modal Body")
            .select(function () { return this.parentNode; }) // div -> body



            /**** Footer ****/
            .select(function () { return this.parentNode; }) // div -> content
            .append("div")
            .attr("id", "root-node-footer")
            .classed("root-node-footer", true)
            .append("text")
            .text("");

    }

    // DRAGGER code for drag box (dragger div)
    createDragActions() {
        var rootContainer = d3.select("div#root-node-content");
        var dragger = d3.select('div#root-node-header');

        dragger
            .call(d3.drag()
                .on("end",
                    function () {
                        var dragger = d3.select('div#root-node-header');
                        dragger.attr("mx", 0)
                        dragger.attr("my", 0)
                    })

                .on("start",
                    function () {
                        var dragger = d3.select('div#root-node-header');
                        //console.log("start-x", d3.mouse(this.parentNode.parentNode.parentNode)[0]);
                        // console.log("start-y", d3.mouse(this.parentNode.parentNode.parentNode)[1]);
                        // console.log("start-dx", propContainer.node().getBoundingClientRect().left );

                        dragger.attr("mx", d3.mouse(this.parentNode.parentNode)[0])
                        dragger.attr("my", d3.mouse(this.parentNode.parentNode)[1])
                        dragger.attr("dx", rootContainer.node().getBoundingClientRect().left)

                    })

                .on('drag',
                    function () {
                        var g_x = d3.mouse(this.parentNode.parentNode)[0];
                        var g_y = d3.mouse(this.parentNode.parentNode)[1];
                        if (g_x < 0) { return; }

                        var dragger = d3.select('div#root-node-header');
                        var mx = dragger.attr("mx");
                        var my = dragger.attr("my");

                        var calc = g_x - (mx - dragger.attr("dx"));
                        rootContainer.style('left', Math.max(0, calc) + 'px');
                        rootContainer.style('top', Math.max(0, g_y - 5) + 'px');

                        // console.log("g_x", g_x, "mx", mx, "dx", dragger.attr("dx"), "calc", calc);

                    })
            );
    }

    // external call in to show dialog to user
    showRootNodeSelection() {
        // build the default layout with the loading img
        this.createLoadingLayout();

        // call APIC Comms to get a list of the topRoot direct decendants
        var lfunc = function (_this_) {
            if (_this_.readyState === 4) {
                if (_this_.status === 200) {
                    respJson = JSON.parse(_this_.responseText);
                    chgRootWin.createManagedObjectsLayout(respJson);
                }
            }
        }

        // provide a call back function when the data is recieved.
        var url = '/api/mo/.json?query-target=children';
        sendToAPIC("GET", url, lfunc);

        // show this dialog - must do before setting left/top pos
        d3.select("div#root-node-modal-window").style("display", "block");

        // center the dialog
        var filterContentDiv = d3.select("div#root-node-content");
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
    }

    // shows the loading classes screen while waiting for APIC to respond
    createLoadingLayout() {
        // Dialog Title
        d3.select("#root-node-title").text("Change Root MO");

        // Dialog Body
        d3.select("#root-node-body").selectAll('*').remove();  // cleanup from last display of data
        var dBody = d3.select("#root-node-body") // is a div

        // append a new main containing div
        var dData = dBody.append("div")
            .attr("id", "main-loader-container")
            .style("height", "250px")
            .style("justify-content", "center")
            .style("align-items", "center")
            .style("display", "flex")
            ;


        var loading = dData.append("div")
            .classed("loader-container", true)

        loading.append("div")
            .classed("loader-loader-container", true)
            .append("div")
            .classed("loader", true);

        loading.append("div")
            .classed("loader-text-container", true)
            .append("text")
            .style("padding", "10px")
            .text("Loading Managed Objects...");

        // footer
        d3.select("#root-node-footer").selectAll('*').remove();
        var footer = d3.select("#root-node-footer");

        /* submit button */
        footer.append("div")
            .classed("query-button", true)
            .on("click",
                function () {
                    var absClassName = d3.select('select#root-con-sel').node().value;

                    if (absClassName.length === 0) { alert("todo-must select from both selections"); return; };

                    var url = "/api/mo/" + absClassName + ".json";

                    var lfunc = function (_this_) {
                        if ((_this_.readyState === 4) && (_this_.status === 200)) {
                            collapse(root);
                            //root.d.children = null;
                            //root.d._children = null;
                            update(root);

                            // parse JSON and create new datum for root node
                            respJson = JSON.parse(_this_.responseText);
                            for (firstKey in respJson.imdata[0]);
                            console.log("abstract class name= ", firstKey);
                            var childNode = respJson.imdata[0][firstKey].attributes;

                            root = d3.hierarchy(childNode);//, function(d) { return d.children; });
                            root.appdata = [];   // save session data
                            root.x0 = root.y0 = 0;
                            root.id = "n" + nextNodeID++;
                            root.parent = null;
                            root.children = null;
                            root._children = null;
                            root.label = "(" + root.data.dn + ")";
                            root.depth = 0;
                            root.absclassname = firstKey;
                            root.dn = childNode.dn;
                            root.defaultQueryFilter = "query-target=children";
                            root.appdata.defaultQueryFilter = root.defaultQueryFilter;
                            root.appdata.lastQueryFilter = root.defaultQueryFilter;

                            //console.log("childNode.faults.critical ", childNode.faults[0].warning);
                            root.critical = 0;
                            root.major = 0;
                            root.minor = 0;
                            root.warning = 0;
                            root.info = 0;

                            //console.log("Root is: ", root);                
                            update(root);
                            resetNodeTextPos();
                            updateScale();
                            showNodeProperties(root);

                            d3.select("div#root-node-modal-window").style("display", "none");
                        }
                    };

                    sendToAPIC("GET", url, lfunc);
                })
            .append("text")
            .text("Submit");

        footer.append("div").classed("query-button-spacer", true)

        /* cancel button */
        footer.append("div")
            .classed("query-button", true)
            .on("click", function () {
                d3.select("div#root-node-modal-window").style("display", "none");
            })
            .append("text")
            .text("Cancel");

        return;
    }

    // call back from APIC Comms from showRootNodeSelection
    createManagedObjectsLayout(jsonData) {
        this.jsonAbsClasses = [];
        // console.log("createManagedObjectsLayout", jsonData, "Count: ", jsonData.totalCount);

        if (jsonData.totalCount === 0) {  // tidy up - error
            alert(">>>>>************>>>>>>>no top level root children ????")
        }


        /********************************************************************
            get JSON data passed, build new json having top level unique 
            abs class names and the children the concrete classes DN names.
        *********************************************************************/

        //console.log("root length= ", jsonData.imdata.length);

        //for( var i=0; i<jsonData.totalCount; i++ )
        for (var i = 0; i < jsonData.imdata.length; i++) {
            for (firstKey in jsonData.imdata[i]);        // the abstract class name

            // does this class already exist
            this.bClassExists = false;
            for (var j in this.jsonAbsClasses) {
                if (this.jsonAbsClasses[j].classname === firstKey) {
                    // add the DN as class already exists
                    this.jsonAbsClasses[j].dn.push(jsonData.imdata[i][firstKey].attributes.dn);
                    this.bClassExists = true;
                    break;
                }
            }

            // if we dont have this  abs class already in JSON, add it along with DN
            if (!this.bClassExists) {
                // add the Abstract class and dn along with it
                this.jsonAbsClasses.push({ "classname": firstKey, "dn": [jsonData.imdata[i][firstKey].attributes.dn] });
            }

        }

        // sort alpha (classname)
        this.jsonAbsClasses.sort(function (x, y) { return ((x.classname == y.classname) ? 0 : ((x.classname > y.classname) ? 1 : -1)); });
        //console.log("Abstract Classes Length: ", this.jsonAbsClasses.length, this.jsonAbsClasses) ;


        /******************************************************************** 
         *                          Build Layout 
         ********************************************************************/

        // get existing main container
        var sParent = d3.select("#root-node-body");

        // create main outer container
        var dContainer =
            sParent.append("div") // is an all encompasing container div
                .attr("id", "#root-node-sel-container")
                .style("display", "none")       // hide until ready
                .style("height", "250px");


        // curr sel
        dContainer.append("div")
            .attr("id", "root-curr-sel")
            .style("width", "75%")
            .style("height", "40px")
            //.style("vertical-align", "middle")
            .style("margin", "25px 50px 0px 50px")
            .text(function () { return "Active Root: " + root.dn; });


        // abstract class selection
        dContainer.append("div")
            .attr("id", "root-abs-sel-cont")
            .append("select")
            .attr("id", "root-abs-sel")
            .classed("rootselect", true)
            .on('change', this.absClassSelChange.bind(this))

            .selectAll("option")
            .data(this.jsonAbsClasses).enter()
            .append("option")
            .text(function (d) {
                //console.log("d", d.classname);
                return d.classname;
            });
        // concrete class selection
        dContainer.append("div")
            .attr("id", "root-con-sel")
            .append("select")
            .attr("id", "root-con-sel")
            .classed("rootselect", true);

        // show this
        dContainer.style("display", "block");

        // hide loader
        d3.select("div#main-loader-container").style("display", "none");

        return;
    }

    // on new abstract class selection, show the concrete implementations of abs class
    absClassSelChange() {
        // declare basic JSON 
        var jsonDNs = [];

        var absClassName = d3.select('select#root-abs-sel').node().value;
        //console.log("absClassSelChange absClassName= ", absClassName);
        //console.log("jsonAbsClasses= ", this.jsonAbsClasses);

        // find classname in this.jsonAbsClasses.classname, use all elements of this.jsonAbsClasses.dn 
        // for the concrete class options
        for (var i = 0; i < this.jsonAbsClasses.length; i++) {
            if (this.jsonAbsClasses[i].classname === absClassName) {
                // found it
                //console.log("found it", this.jsonAbsClasses[i].dn);
                for (var dn_idx in this.jsonAbsClasses[i].dn) {
                    //console.log("dn", this.jsonAbsClasses[i].dn[dn_idx]);
                    jsonDNs.push(this.jsonAbsClasses[i].dn[dn_idx]);
                }
                break;
            }
        }

        jsonDNs.sort(function (x, y) { return ((x == y) ? 0 : ((x > y) ? 1 : -1)); });

        // concrete class selection
        // removeall from select first.....
        d3.select("select#root-con-sel").selectAll('*').remove();

        d3.select("div#root-con-sel")
            .select("select#root-con-sel")
            .selectAll("option")
            .data(jsonDNs)
            .enter()
            .append("option")
            .text(function (d) { return d; })

    }

} // end class ChangeRoot

