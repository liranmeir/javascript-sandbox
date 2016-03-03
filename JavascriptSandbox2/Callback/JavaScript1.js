define("Controllers.SharepointNewFolder", {
    js:["Controllers.FileIntegrationNewFolder", "Controllers.Base", 'Editors.EditorsFactory']
}, function (BCS)
{ 
    var $ = jQuery.noConflict();
	BCS.Controllers.SharepointNewFolder = BCS.Core.Class.create(BCS.Controllers.FileIntegrationNewFolder, {
        
        initialize: function() {
            
            this._base.apply(this, arguments);
            this._integrationName = 'Sharepoint';
            this.browseItemDataProvider = "SharepointDocs";
            this.browseItemAction = "Documents";
            this.parentSelectedItemType = "";
        },
        //set copy data in ui on ok
        _copyFolderSelected: function(evt, elem)
        {
            var ctrl = $("div[data-ctrl='"+this._integrationName+"FolderFindWindow']");
            var tr = ctrl.find("span.rbn-checked").closest("tr");
            var folderId = tr.data().h_id;
            var folderName = tr.find("[data-fieldname='BDOCNAME']").find(".o-val").html(); //TODO liran BDOCNAME REMOVE THE BDOC to Doc if possible
            var inputs = $("div[data-ctrl='FileIntegrationNewFolder']").find("input");
            inputs[2].value = folderName;
            inputs[3].value = folderId;
            return true;
        }, 
 
        //updateFolderTypeText: function(type){
        //   $("[data-ctrl='SharepointNewFolder'] label.fi-lbl").text(type +" name");
        //},
        
        showProgressIndication: function()
        {
            this.loadingIndicator();
        },
        loadingIndicator: function()
        {
            var loading = document.createElement("div"),
                baseElement = this.getBaseElement(),
                $popup = $(baseElement).parents('[data-ctrl="PopupDialog"]');
            
            loading.id = baseElement.id + "_loadingIndicator";
            loading.className = "spinner small";
            $popup.append(loading);
        },
        blockInteraction: function(withoutProgressIndication)
        {            
            this.overlayId = this.controllerId + "_overlay";

            var baseElement = this.getBaseElement(),
                ind = $('#' + this.overlayId, baseElement),
                $popup = $(baseElement).parents('[data-ctrl="PopupDialog"]');

            if(!withoutProgressIndication)
                this.showProgressIndication();

            if (ind.length)
            {
                ind.show();
                return;
            }

            ind = document.createElement("span");
            ind.className = "load_overlay";
            ind.id = this.overlayId;
            $popup.append(ind);
        }, 
        initForm: function(selectedDocName, selectedDocId, folderId, relativePath, siteUrl) {
            var $container = $('div[data-ctrl="'+ this.controllerName +'"]');
            $container.find("input[name='parentFolderId']")[0].value = folderId;  
            //check if below code can be  replaced
            var parentPath = translate(BCS_NLS_Keys.LocatedIn) + " " + selectedDocName + " ";
           
            $("#parentHolder").html(this.getObjectPathElement());
            $("#parentHolder_objectPathId").text(parentPath);
             
            if(relativePath){
                $container.find("input[name='parentFolderId']").attr("data-relative-path", relativePath);
            }

            if(siteUrl){
                $container.find("input[name='parentFolderId']").attr("data-h_sharepointsiteurl", siteUrl);
            } 
        },
        chooseFolder: function(evt, elem) {
            this._setParentSelectedItemType();
            this._browseFolder(evt, elem, this._copyFolderSelected);
        },
        _browseFolder: function(evt,elem, onOk) {
            var me = this,
				id = 'spDocs2';

            var ctrl = BCS.Controllers.Factory.getOrCreateById(this.getInternalState('AddRelatedId'));
            var siteList = ctrl.getInternalData("siteList");
            //todo (liran):
            //siteListApproved =  call external sharepoint system to validate sitesList

            var siteListApproved = siteList;

              
            require("UI.PopupDialog", function(BCS)
            {
                var w = BCS.UI.PopupFactory.getOrCreate(elem, id, me.contextId);
                w.addButton(BCS_NLS_Keys.BCSPopupDialogs_OK, me.onOk, me, true);
                w.addButton(BCS_NLS_Keys.BCSPopupDialogs_Cancel, function() { return true; }, me);
                w.toggleAnimation(true);
                w.setSize(800, 600);
                w.setTitle("Copy from " + me.parentSelectedItemType);
                w.setCloseIconCallback(me, function() { return true; });
                w.show();

                var info = {}, state, params;


                info.success = function(json, status, response, info, callback)
                {
                    if (status = 'success' && json)
                    {
                        if (json && json.data && json.data.associate)
                        {
                            BCSUserSettings.userinformation.associatedWithBox = null;
                            w.addButton(BCS_NLS_Keys.AssociateWithSharePoint, function() { w.remove();
                                me.showBDocs(evt, elem);
                            }, me, true);
                            w.replaceButton(BCS_NLS_Keys.BCSPopupDialogs_OK, BCS_NLS_Keys.AssociateWithSharePoint);
                            w.setSize(400, 200);
                        }

                        if (json.data && json.data.gridId)
                            w.setResizer("FileIntegrationFindWindowResizer", [json.data.gridId]);
                         
                        w.setHtmlContent(json.html, function(){
                            var internalController = BCS.Controllers.Factory.getOrCreateById(w.internalControllerId);
                            internalController.popupDialogId = w.dialog.id;
                            
                            callback(arguments);
                        });
                        
                        setTimeout(function() { $("#spDocs2_filter_searchfilterInput").focus(); }, 300);
                    } 
                    return true;
                };
              
                state = { 
                            Id: id, 
                            DataProvider: "SharePointDocs", 
                            Action: "Documents", 
                            ContextId: me.contextId, 
                            LocalContextId: me.contextId + '.' + id, 
                            GridDataProvider: "SharePointDocs", 
                            GridAction: "ExistingDocuments", 
                            UseSimpleFilters: true,
                            AllowedDocsType: me.parentSelectedItemType
                        };

                params = { folderId: "-1", filtersInfo: null ,siteList: siteListApproved, parentSelectedItemType:me.parentSelectedItemType};
                internalContextParams = ["filtersInfo"];
                info.data = { request: { htmlBuilder: "SharePointDocsFindWindow", 
                    htmlBuilderState: state, parameters: params, internalContextParams: internalContextParams} };
                me.retrieveData(info);
            }); 
        },
        
        _setParentSelectedItemType: function() {
            
            var newFolderCtrl = this._integrationName + 'NewFolder';
            var $createItemType =   $('[data-ctrl="'+newFolderCtrl+'"] input#selectedParentItemType');
            this.parentSelectedItemType =  $createItemType.val();
        }
    });
});
