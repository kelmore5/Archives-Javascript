/**
 * Created by kelmore5 on 4/6/17.
 */

//noinspection JSUndeclaredVariable
require(['dojo/_base/array', 'dojox/layout/ContentPane', 'dojo/aspect', 'dijit/form/Button',
        'dijit/form/Select', 'dijit/form/TextBox', 'dojo/_base/lang', 'dijit/layout/TabContainer',
        'dojo/store/JsonRest', 'dojox/grid/EnhancedGrid', 'dojo/json', 'dijit/registry',
        'dojo/data/ObjectStore', 'dojo/store/Memory', 'dojo/store/Cache', 'dojo/store/Observable',
        'dijit/Dialog', 'dojo/ready', "dojo/_base/window", "dojo/dom-style", 'dojox/widget/Standby',
        'dojo/_base/Deferred', "dojo/topic", 'dojo/_base/event', "dojox/html/metrics", 'dojox/grid/util',
        "dojo/_base/html", 'dojo/date/stamp', 'dijit/form/DateTextBox', 'dijit/layout/LayoutContainer',
        'dojox/grid/DataGrid', 'dijit/Tree',
        'dojox/grid/enhanced/plugins/Selector', 'dojox/grid/enhanced/plugins/IndirectSelection',
        'dojox/grid/enhanced/plugins/Filter'],
    function(array, ContentPane, aspect, Button, Select, TextBox, lang, TabContainer, JsonRest, EnhancedGrid,
             Json, registry, ObjectStore, Memory, Cache, Observable, Dialog, ready, win, domStyle, Standby,
             Deferred, topic, event, metrics, util, html, stamp, DateTextBox, LayoutContainer, DataGrid, Tree) {

        /**
         * Quickly adds text to a div
         * @param addToDiv The div to add text to
         * @param text The text to be added
         */
        var addText = function(addToDiv, text) {
            var newcontent = document.createElement('div');
            newcontent.innerHTML = text;
            addToDiv.appendChild(newcontent.firstChild);
        };

        /**
         * Set the text of an HTML element
         * @param boxId The id of the element to set the text of
         * @param text The text to be set
         */
        var setText = function(boxId, text) {
            var box = dojo.byId(boxId);
            box.value = text;
        };

        /**
         * Sets the disabled feature an HTML element
         * @param boxId The id of the element to enable or disable
         * @param value False if element should not be disabled, true otherwise
         */
        var setDisabled = function(boxId, value) {
            var box = dijit.byId(boxId);
            box.set('disabled', value);
        };

        /**
         * Function to enable or disable buttons based on selections in a Dojox datagrid
         * Enables if multiple items are selected
         * @param gridId The grid to determine the button status
         * @param buttonId The button to enable or disable
         */
        var enableButtonOnAnySelection = function(gridId, buttonId) {
            var grid = dijit.byId(gridId);
            var items = grid.selection.getSelected();
            var button = dijit.byId(buttonId);
            if (items.length) {
                button.set('disabled', false);
            }
            else {
                button.set('disabled', true);
            }
        };

        /**
         * Function to enable or disable buttons based on selections in a Dojox datagrid
         * Enables if only one item is selected
         * @param gridId The grid to determine the button status
         * @param buttonId The button to enable or disable
         */
        var enableButtonForSingle = function(gridId, buttonId) {
            var grid = dijit.byId(gridId);
            var items = grid.selection.getSelected();
            var button = dijit.byId(buttonId);
            if (items.length == 1) {
                button.set('disabled', false);
            }
            else {
                button.set('disabled', true);
            }
        };

        /**
         * Formats the value used for a date string
         * (Basically just adds a zero if the value is less than 10)
         * E.g. This will change a date from 1-10-5 (don't want) to 01-10-05 (adds the zero)
         * @param value The value to be formatted
         * @returns {string} The formatted date string
         */
        var formatTimeNumber = function(value) {
            return value < 10 ? "0" + value : value;
        };

        /**
         * Gets a string representation of the current date
         * In the format (YYYY-MM-dd hh:mm:ss
         * @returns {string}
         */
        var getCurrentDate = function() {
            var date = new Date();
            date.setTime(Date.now());
            var dateString = date.getFullYear() + "-"
                + formatTimeNumber(date.getMonth()+1) + "-"
                + formatTimeNumber(date.getDate()) + " "
                + formatTimeNumber(date.getHours()) + ":"
                + formatTimeNumber(date.getMinutes()) + ":"
                + formatTimeNumber(date.getSeconds()) + ".000";
            return dateString;
        };

        /**
         * Destroys all the widgets in a dijit object
         * Better than normal removal methods because de-registers the ID of each
         * widget from the dijit registry
         * @param divToDestroy The id of the object to remove widgets from
         */
        var destroyWidgets = function (divToDestroy) {
            if (divToDestroy != null) {
                var resetWidgets = registry.findWidgets(divToDestroy);
                dojo.forEach(resetWidgets, function (w) {
                    w.destroyRecursive(false);
                });
            }
        };

        /** Creates an object store to be put in a grid
         *
         * @param urlMapping - The url that the servlet maps to in the Web.xml file
         */
        var createDefaultObjectStore = function(urlMapping) {
            return new ObjectStore({objectStore: new JsonRest({target: urlMapping, syncMode: true,})});
        };

        /**
         * Adds a tab for a TabContainer that includes both a main content for data
         * along with a LayoutContainer to add extra features in (e.g. this is usually used for Button(s))
         *
         * @param tabContainer - the TabContainer the ContentPane is being added to
         *
         * @param mainContent - the widget to set as the main content for the LayoutContainer
         * 						typically: a grid for data
         *
         * @param tabTitle - the title of the tab
         *
         * @param extraLayoutId - the ID for the layout to be inserted in the tab after the main content
         */
        var createTabWithGridAndLayout = function(tabContainer, tabTitle, mainContent, extraLayoutID) {
            var lc = new LayoutContainer({
                style: "width: 100%; height:100%; overflow:auto"
            });

            var cp = new ContentPane({
                content: mainContent,
                region: "center",
            });

            lc.addChild(cp);

            tabContainer.addChild(new ContentPane({
                title: tabTitle,
                content:lc
            }));

            dojo.create("div", {id: extraLayoutID,}, mainContent.domNode, "after");
        };

        /**
         * Destroy all the widgets in a content pane and optionally the pane itself
         * @param id The id of the pane
         * @param destroyPane True if the pane should be destroyed, false otherwise
         */
        var destroyContentPaneWidgets = function(pane, destroyPane){
            try {
                array.forEach(registry.findWidgets(dojo.byId(pane)), function(w) {
                    w.destroyRecursive();
                });

                if(destroyPane) {
                    dijit.byId(pane).destroyRecursive();
                }
            } catch(ex) {}
        };

        /**
         * Creates a removal standby object for a specific widget
         * @param target The widget to overlay the standby on
         * @param eventWidget The widget that determines when the standby ends
         * @param event The event that determines when the standby will end
         */
        var createStandbyWithRemove = function(target, eventWidget, event) {
            var standby = createStandby(target);

            var listener = null;
            listener = aspect.after(eventWidget, event, function() {
                standby.destroyRecursive();
                listener.remove();
            });
        };

        /**
         * Creates a standby object
         * @param target The widget to overlay the standby on
         * @returns {*} The standby object
         */
        var createStandby = function(target) {
            var standby = new Standby({target: target});
            document.body.appendChild(standby.domNode);
            standby.startup();
            standby.show();

            return standby;
        };

        /**
         * Easy button generator
         * @param label The label for the button
         * @param id The id
         * @param onclick OnClick function
         */
        var buttonGenerator = function(label, id, onclick, style) {
            new Button({
                label: label,
                onClick: onclick,
                style: style
            }, id);
        };

        /**
         * Creates a textbox with some default info (style/trim)
         * @param name The name of the textbox
         * @param value Default value for textbox
         * @param id The id
         */
        var textBoxGenerator = function(name, value, id) {
            new TextBox({
                trim: true,
                name: name,
                value: value,
                style: "width:32em;"
            }, id);
        };

        //Extends the TextBox class to include error message handling
        lang.extend(TextBox, {
            rowIndex: 0,
            errorMessage: undefined,

            //What needs to be checked for all textboxes
            //Optional error message argument to replace default
            checkValue: function(errorMessage) {
                var deferred = new Deferred();
                var _this = this;

                if(_this.maxLength) {
                    if(_this.get("value").length > _this.maxLength) {
                        var errorMessage2 = _this.title + " name is too long. The max length for " + _this.title + " is " + _this.maxLength + " characters.";
                        deferred.resolve({success: _this.changeState(false, errorMessage2)});
                        return deferred.promise;
                    }
                }

                _this.extraValueCheck().then(function() {
                    deferred.resolve({success: _this.changeState(true)});
                }, function(err) {
                    deferred.reject({success: _this.changeState(false, errorMessage)});
                });

                return deferred.promise;
            },

            //An extra value check for textboxes
            //Can be set to whatever the developer wants
            //In other words: checkValue runs, and then whatever
            //function is in extraValueCheck is run
            //Just make sure extraValueCheck returns a deferred.promise value
            //Maybe turn into event later
            extraValueCheck: function() {
                var deferred = new Deferred();
                var _this = this;
                _this.get("state") != "Error" ? deferred.resolve({success:true}) : deferred.reject({success: _this.changeState(false)});
                return deferred.promise;
            },

            //Checks the state of the widget
            //Takes in boolean operator and prints out (optional) error message
            //if boolean returned false
            //Used in changeMode.jsp
            changeState: function(bool, errorMessage) {
                var _this = this;

                if(bool) {
                    _this.state = "Success";
                } else {
                    _this.state = "Error";
                    if(errorMessage) {
                        _this.showErrorMessage(errorMessage);
                    } else if(_this.errorMessage) {
                        _this.showErrorMessage(_this.errorMessage);
                    }
                }

                return bool;
            },

            showErrorMessage: function(errorMessage) {
                showErrorDialog(errorMessage);
            }
        });

        /**
         * Extends dijit dialog to include options for an ok and cancel button
         * Also adds functionality to include an event on the ok button
         */
        lang.extend(Dialog, {
            addOkButton: false,

            addOkButtonFunction: null,

            addCancelButton: false,

            postCreate: function(){
                domStyle.set(this.domNode, {
                    display: "none",
                    position:"absolute"
                });
                win.body().appendChild(this.domNode);

                this.inherited("postCreate", arguments);

                this.connect(this, "onExecute", "hide");
                this.connect(this, "onCancel", "hide");
                this._modalconnects = [];

                if(this.addOkButton || this.addCancelButton) {
                    var dialog = this.id;

                    dojo.create("div", {id: dialog + "buttonContainer",
                            style: {"background-color": "#EFEFEF", "border-top" : "1px solid #d3d3d3",
                                padding: "3px 5px 2px 7px", "text-align":"center"}},
                        this.containerNode, "after");

                    if(this.addOkButton) {
                        var button = new Button({
                            label:"OK",
                            onClick: function() {
                                dijit.byId(dialog).destroy();
                            }
                        }).placeAt(this.id + "buttonContainer", "last");

                        if(this.addOkButtonFunction != null) {
                            var listener = null;
                            listener = aspect.after(button, "onClick", this.addOkButtonFunction);

                            var listener2 = null;
                            listener2 = aspect.after(button, "onClick", function(){
                                if(listener != null) {
                                    listener.remove();
                                }
                                else {
                                    listener2.remove();
                                }
                            });
                        }
                    }

                    if(this.addCancelButton) {
                        new Button({
                            label:"Return",
                            onClick: function() {
                                dijit.byId(dialog).destroy();
                            }
                        }).placeAt(this.id + "buttonContainer", "last");
                    }
                }
            },
        });

        /**
         * Extends the dojox enhanced grid class to add selected columns
         * This way, someone can select the entire column of a data grid
         */
        lang.extend(EnhancedGrid, {
            buildRendering: function(){
                if(this.enableColumnEdit){this.setupSelectableColumns();}

                this.inherited("buildRendering", arguments);
                if(!this.domNode.getAttribute('tabIndex')){
                    this.domNode.tabIndex = "0";
                }
                this.createScroller();
                this.createLayout();
                this.createViews();
                this.createManagers();

                this.createSelection();


                this.connect(this.selection, "onSelected", "onSelected");
                this.connect(this.selection, "onDeselected", "onDeselected");
                this.connect(this.selection, "onChanged", "onSelectionChanged");

                metrics.initOnFontResize();
                this.connect(metrics, "onFontResize", "textSizeChanged");
                util.funnelEvents(this.domNode, this, 'doKeyEvent', util.keyEvents);
                if (this.selectionMode != "none") {
                    this.domNode.setAttribute("aria-multiselectable", this.selectionMode == "single" ? "false" : "true");
                }

                html.addClass(this.domNode, this.classTag);
                if(!this.isLeftToRight()){
                    html.addClass(this.domNode, this.classTag+"Rtl");
                }
            },

            postCreate: function(){
                //create plugin manager
                this.pluginMgr = new this._pluginMgrClass(this);
                this.pluginMgr.preInit();
                this.inherited("postCreate", arguments);
                this.pluginMgr.postInit();

                if(this.enableColumnEdit) {this.setupSelectableColumnEvents();}
            },

            //Set to enable editable columns
            enableColumnEdit: false,

            //Functoin to setup selecetable columns
            setupSelectableColumns: function() {
                var _this = this;

                this._wasClicked = false;

                if(this.plugins) {
                    if(!this.plugins.selector) {
                        this.plugins.selector = true;
                    }
                }
                else {
                    this.plugins.selector = true;
                }

                var newStructure = lang.clone(this.structure);
                newStructure[1] = new Array();

                //Adds a checkbox to each column header to allow column selection
                array.forEach(this.structure[1], function(layout, i) {
                    newStructure[1][i] = lang.clone(layout);
                    newStructure[1][i]["selected"] = false;
                    if(layout.selectable) {
                        newStructure[1][i]["title"] = newStructure[1][i]["name"];
                        newStructure[1][i]["input"] = '<input type="checkbox" id="' + _this.id + 'headerCheck' + i + '"/>';
                        newStructure[1][i]["name"] = newStructure[1][i]["input"] + newStructure[1][i]["name"];
                    }
                });

                this.structure = null;
                this.structure = newStructure;
                this.structure[1] = newStructure[1];
            },

            //Ability to select events when columns are selected
            setupSelectableColumnEvents: function() {
                var _this = this;

                aspect.before(this, "onHeaderCellClick", function(e) {
                    if(_this.structure[1][e.cell.index].selectable) {
                        var checked = dojo.byId(_this.id + "headerCheck" + e.cell.index).checked;
                        var wasClicked = (checked != _this.structure[1][e.cell.index].selected);

                        if(wasClicked) {
                            _this._wasClicked = true;

                            _this.structure[1][e.cell.index].selected = !_this.structure[1][e.cell.index].selected;
                            if(!_this.structure[1][e.cell.index].selected) {
                                //Otherwise, deselect it and reselect the affected rows
                                //(Deselecting a column also deselects the row, so we need to select the row again
                                var rows = _this.pluginMgr.getPlugin("selector").getSelected("row", true);
                                _this.pluginMgr.getPlugin("selector").deselect("col", e.cell.index);

                                array.forEach(rows, function(row, i) {
                                    _this.pluginMgr.getPlugin("selector").select("row", row.row);
                                });
                            }

                            _this.checkColumns();
                        }
                    }
                });

                aspect.after(this, "_resize", function() {_this.checkColumns();});
                aspect.after(this.selection, "onDeselected", function() {_this.checkColumns();});
            },

            setSortIndex: function(inIndex, inAsc){
                // summary:
                // 		Sort the grid on a column in a specified direction
                // inIndex: Integer
                // 		Column index on which to sort.
                // inAsc: Boolean
                // 		If true, sort the grid in ascending order, otherwise in descending order

                if(this.enableColumnEdit) {
                    if(this._wasClicked) {
                        this._wasClicked = false;
                        return;
                    }
                }

                var si = inIndex +1;
                if(inAsc != undefined){
                    si *= (inAsc ? 1 : -1);
                } else if(this.getSortIndex() == inIndex){
                    si = -this.sortInfo;
                }
                this.setSortInfo(si);
            },

            //Checks the columns the user has selected and highlights the datagrid
            checkColumns: function() {
                var _this = this;

                //Get the header checkbox array to determine which columns to select
                array.forEach(this.structure[1], function(layout, i) {
                    if(layout.selected) {
                        //Select the header checkbox and the column
                        document.getElementById(_this.id + "headerCheck" + i).checked = true;
                        _this.pluginMgr.getPlugin("selector").select("col", i);
                    }
                });
            }
        });

        /**
         * Adds a function to the date text box to return a foratted date
         */
        lang.extend(DateTextBox, {
            getFormattedDate: function() {
                var value;

                try {
                    value = stamp.toISOString(this.get("value"), {selector: 'date'});
                } catch(ex) {
                    value = this.get("value");
                }

                return value;
            }
        });

        /**
         * Creates an error dialog with an ok button
         * @param text The text to put in the dialog
         */
        var showErrorDialog = function(text) {
            new Dialog({
                title: "Error",
                addOkButton: true,
                content: text
            }).show();
        };

        /**
         * Creates a submit dialog
         * @param text The text to put in the dialog
         * @param okFunction The event to carry out when ok is clicked
         * @param title The title of the dialog
         */
        var showSubmitDialog = function(text, okFunction, title) {
            showMessageDialog(text, okFunction, true, title);
        };

        /**
         * Creates a submit dialog
         * @param text The text to put in the dialog
         * @param okFunction The event to carry out when ok is clicked
         * @param addCancelButton Adds a cancel button to the message dialog
         * @param title The title of the dialog
         */
        var showMessageDialog = function(text, okFunction, addCancelButton, title) {
            new Dialog({
                title: title == null ? "Message" : title,
                addOkButton: true,
                addOkButtonFunction: okFunction != null ? okFunction : null,
                addCancelButton: addCancelButton,
                content: text
            }).show();
        };

        //	Used to close all the tabs on a table using the table id. First gets the tabs and then removes them
        //	Optional: List of button ids (buttonIds) to disable if there is a button relating to tabs
        var closeAllTheTabs = function(tableId, buttonIds) {
            dijit.byId(tableId).closeAll();

            //Set the close all tabs button to disabled if id does not equal null
            if(buttonIds != null) {
                array.forEach(buttonIds, function(id, i) {
                    dijit.byId(id).set("disabled", true);
                });
            }
        };

        /**
         * Creates a cache store, fetches the information from the query
         * (thus writing the information to cache), and returns an ObjectStore
         * Used for DataGrids and allows for client-side sorting
         *
         * @param jsonStore A store object (e.g. JsonStore)
         * @param gridId The id of the grid (e.g. DataGrid) the store is going into
         * @param query OPTIONAL A query to use
         */
        var createCacheStore = function(gridId, jsonStore, query, tabIndex) {
            query = (query == null) ? "" : query;
            //Wrapping new memory in observable to allow sorting
            //Need to overwrite put function as well to put id in
            //WILL NOT WORK OTHERWISE
            var storeMemory = new dojo.store.Observable(new dojo.store.Memory({
                // Observable only works correctly when object has an id. Memory store does not add id to object when creating an object
                // see bugs http://bugs.dojotoolkit.org/ticket/12835 and http://bugs.dojotoolkit.org/ticket/14281
                // Will be fixed with dojo 1.8
                // Also Observable does not work correctly with JsonRest. Therefore we use the grid with the Memory Store and the Observable
                put: function(object, options) {
                    var data = this.data, index = this.index, idProperty = this.idProperty;
                    var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
                    if (id in index) {
                        if (options && options.overwrite === false) {
                            throw new Error("Object already exists");
                        }
                        data[index[id]] = object;
                    }
                    else {
                        index[id] = data.push(object) - 1;
                    }
                    return id;
                }
            }));

            //Create the cache store with the jsonStore and memoryStore
            var cacheStore = new dojo.store.Cache(jsonStore, storeMemory);

            //Query the cache to store the results in memory
            //Afterwards, check if there were any results. If not,
            //tell the user
            cacheStore.query(query).then(function() {
                if(storeMemory.data.length == 0) {
                    dijit.byId(gridId).getChildren()[tabIndex-1].content.showMessage("Unfortunately, no results were found. Please check your input and resubmit.");
                }
            });

            return new dojo.data.ObjectStore({objectStore: storeMemory});
        };

        /**
         * Creates a json object
         * @param key The key value
         * @param value The value
         * @returns {{}} A json representation (key -> value)
         */
        var createJsonObject = function(key, value) {
            var obj = {};
            obj[key] = value;
            return obj;
        };

        //	Disables a list of buttons (tabButtonIds) for a table when the last item is closed
        //	using the table ID and the button ID
        var disableButtons = function(tableId, tabButtonIds) {
            if(dijit.byId(tableId).getChildren().length == 1) {
                array.forEach(tabButtonIds, function(id, i) {
                    dijit.byId(id).set("disabled", true);
                });
            }
        };
    });