var MT_User = Class.create();
MT_User.getByID = function(id){
   return new MT_User(id);
};
MT_User.prototype = Object.extendsObject(MT_Base, {
    initialize: function (rec) {        
        this.rec = this._getRecord(rec, 'sys_user');      
    },

    isDelegateFor: function(user_id) {
        var gr = new GlideRecord("sys_user_delegate");
            gr.addQuery("user",user_id);
            gr.addQuery("delegate",this.getSysId());
            gr.addQuery("approvals", "true");
            gr.addQuery("starts", "<=", gs.daysAgo(0));
            gr.addQuery("ends", ">=", gs.daysAgo(0));
            gr.query();
         return gr.hasNext();
    },

    isAdmin: function() {
       return this.hasRole('admin'); 
    },

    isActive: function() {
        return this.rec.active == true;
    },

    hasRole: function(roles,bAll) {
       if(JSUtil.nil(roles)) return false;
       var arr, counter = 0;
       bAll = bAll || false;
       if(roles instanceof Array) { arr = roles.slice(0);} 
       else if (typeof roles == "string") {(arr = []).push(roles);}

       for(var i = 0;i<arr.length;i++){
          var gr = new GlideRecord("sys_user_has_role");
              gr.addQuery("user", this.rec.getUniqueValue());
              gr.addQuery('role.name', arr[i]);
              gr.query();
          counter = gr.hasNext() ? (counter+1) : counter;          
       }
       return (bAll == true ? (counter == arr.length) : (counter != 0));
    },

    hasAnyRole: function() {
        var gr = new GlideRecord("sys_user_has_role");
            gr.addQuery("user", this.rec.getUniqueValue());
            gr.query();
        return gr.getRowCount() > 0;
    },

    isHRMember: function () {
        var gr = new GlideRecord('sys_user_grmember');
            gr.addQuery('user', this.getSysId());
            gr.addQuery('group.u_hr', true);
            gr.query();
        return gr.getRowCount() >= 1;
    },

    removeAllRoles: function () {
        var gr = new GlideRecord("sys_user_has_role");
            gr.addQuery("user", this.getSysId());
            gr.deleteMultiple();
    },

    removeFromAllGroups: function () {
        var gr = new GlideRecord("sys_user_grmember");
            //gr.addQuery("group.u_hr", false);
            gr.addQuery("user", this.getSysId());
            gr.deleteMultiple();
    },

    removeFromGroup: function (group_id) {
        if (gs.nil(group_id)) return false;

        var answer = false;
        var gr = new GlideRecord("sys_user_grmember");
            gr.addQuery("user", this.getSysId());
            gr.addQuery("group", group_id);
            gr.query();

        if (gr.next()) {
            gr.deleteRecord();
            answer = true;
        }
        return answer;
    },

    addToGroup: function (group_id) {
        if (gs.nil(group_id) || this.isGroupMember(group_id)) return false;

        var gr = new GlideRecord("sys_user_grmember");
            gr.initialize();
            gr.user = this.getSysId();
            gr.group = group_id;
        return gr.insert();
    },

    isGroupMember: function (group_id) {
        if (gs.nil(group_id)) return false;

        var gr = new GlideRecord("sys_user_grmember");
            gr.addQuery("user", this.getSysId());
            gr.addQuery("group", group_id);
            gr.query();
        return gr.hasNext();
    },

    hasGroupAsDefault: function(group_id) {
         var gr = new GlideRecord("sys_user_grmember");
             gr.addQuery("user", this.getSysId());
             gr.addQuery("group", group_id);
             gr.query();
             gr.next();

         return gr.u_default == true;
    },

    getMyDefaultGroup: function() {
        var answer = null;
        var gr = new GlideRecord("sys_user_grmember");  
            gr.addQuery("user", this.getSysId());
            gr.addQuery("u_default", true);
            gr.setLimit(1);
            gr.query();
         if(gr.next()) {
            answer = gr.group.toString();
         }
         return answer;
    },

    getMyFirstGroup: function() {
        var answer = null;
        var gr = new GlideRecord("sys_user_grmember");  
            gr.addQuery("user", this.getSysId());            
            gr.orderByDesc("sys_created_on");
            gr.setLimit(1);
            gr.query();
         if(gr.next()) {
            answer = gr.group.toString();
         }
         return answer;
    },

	// LICENSES - NEW CODING - JH SAM Rollout
	//checks the license M2M table to see if the user passed across has a license relationship already
    hasLicense: function(license_id) {
       var gr = new GlideRecord("alm_entitlement_user");
           gr.addQuery("licensed_by", license_id);
           gr.addQuery("assigned_to", this.getSysId());           
           gr.query();
       return gr.hasNext();
    },

    deleteLicenseRel: function (license_id) {
        if (gs.nil(license_id)) return false;

        var gr = new GlideRecord("alm_entitlement_user");
            gr.addQuery("licensed_by", license_id);
            gr.addQuery("assigned_to", this.getSysId());
            gr.setLimit(1);
            gr.query();

        if (gr.next()) {
            gr.deleteRecord();
        }
    },
    addLicenseRel: function (license_id,stopDuplicates) {
        if (gs.nil(license_id)) return false;

        stopDuplicates = stopDuplicates || false;

        // prevent duplicate license relationships
        if(stopDuplicates && this.hasLicense(license_id)) return;

        var gr = new GlideRecord("alm_entitlement_user");
            gr.initialize();
            gr.assigned_to = this.getSysId();
            gr.licensed_by = license_id;
            gr.u_submission_type = 'automatic';
        return gr.insert();
    },
	//END OF LICENSE CODING

/*    // LICENSES - ORIGINAL CODING
	//checks the license M2M table to see if the user passed across has a license relationship already
    hasLicense: function(license_id) {
       var gr = new GlideRecord("slm_license_usage_sys_user_m2m");
           gr.addQuery("license", license_id);
           gr.addQuery("user", this.getSysId());           
           gr.query();
       return gr.hasNext();
    },

    deleteLicenseRel: function (license_id) {
        if (gs.nil(license_id)) return false;

        var gr = new GlideRecord("slm_license_usage_sys_user_m2m");
            gr.addQuery("license", license_id);
            gr.addQuery("user", this.getSysId());
            gr.setLimit(1);
            gr.query();

        if (gr.next()) {
            gr.deleteRecord();
        }
    },
    addLicenseRel: function (license_id,stopDuplicates) {
        if (gs.nil(license_id)) return false;

        stopDuplicates = stopDuplicates || false;

        // prevent duplicate license relationships
        if(stopDuplicates && this.hasLicense(license_id)) return;

        var gr = new GlideRecord("slm_license_usage_sys_user_m2m");
            gr.initialize();
            gr.user = this.getSysId();
            gr.license = license_id;
            gr.u_submission_type = 'automatic';
        return gr.insert();
    },
	//END OF LICENSE CODING
*/
	
	
    getRevokingCIs: function(){       

        /*var exclusions = [];
            exclusions.push("22b084490a0aa0110092a387271f8dab"); // Intranet
            exclusions.push("777c9194ffc55440c626be96baaa9d2d"); // Network File Share 
            exclusions.push("d1be70e00a0aa01100a00fdbb7a6a81e"); // Citrix
            exclusions.push("d1be72d10a0aa011009a479d2bacf81f"); // McCafee
            exclusions.push("cfbfea40e48c5400c626f3a4dab99a24"); // Starters/Leavers form
            exclusions.push("e056d29025a9ac449634b1d7d09b5497"); // Password Safe 
            exclusions.push("f1fbcf300a0aa011016e134aba0d37b9"); // Wireless (WIFI)
            exclusions.push("3465489f0a0aa011012a4e6ddd1a440d"); // Monitor
            exclusions.push("d1be75e20a0aa01100fff68d9aa97bc8"); // Sharepoint
            exclusions.push("62aba484554e1c4096348ccfdc7a8910"); // Risk and Compliance
            exclusions.push("2c2e224f0a0aa01101d2b6d7b3002cce"); // Exchange UK
			exclusions.push("e281616b5537948896348ccfdc7a8937"); // Skype
			exclusions.push("d1be6fe80a0aa01100ee37e517d46a2d"); // Adobe Acrobat Reader
			exclusions.push("303ccbcfa83a60409634d006f05602b4"); //Adobe AIR*/
		var exclusions = [];
            exclusions.push("22b084490a0aa0110092a387271f8dab"); // Intranet
            exclusions.push("777c9194ffc55440c626be96baaa9d2d"); // Network File Share 
            exclusions.push("d1be70e00a0aa01100a00fdbb7a6a81e"); // Citrix
            exclusions.push("d1be72d10a0aa011009a479d2bacf81f"); // McCafee
            exclusions.push("cfbfea40e48c5400c626f3a4dab99a24"); // Starters/Leavers form
            exclusions.push("e056d29025a9ac449634b1d7d09b5497"); // Password Safe 
            exclusions.push("f1fbcf300a0aa011016e134aba0d37b9"); // Wireless (WIFI)
            exclusions.push("3465489f0a0aa011012a4e6ddd1a440d"); // Monitor
            exclusions.push("d1be75e20a0aa01100fff68d9aa97bc8"); // Sharepoint
            exclusions.push("62aba484554e1c4096348ccfdc7a8910"); // Risk and Compliance
            exclusions.push("2c2e224f0a0aa01101d2b6d7b3002cce"); // Exchange UK
			exclusions.push("e281616b5537948896348ccfdc7a8937"); // Skype
			exclusions.push("d1be6fe80a0aa01100ee37e517d46a2d"); // Adobe Acrobat Reader
			exclusions.push("303ccbcfa83a60409634d006f05602b4"); // Adobe AIR
			exclusions.push("5d29846d55c420c896348ccfdc7a8909"); // Adobe Flash Player
			exclusions.push("ab8d2cfe0a0aa01100d3521a8dd15935"); // ADP
			exclusions.push("d1c18cef0a0aa01101805bbdd1e732d6"); // Apple Mac OSX 
			exclusions.push("d1be70340a0aa011001160d5d955166a"); // Apple QuickTime
			exclusions.push("9b51f66e0a0aa01101830ccc2f3cd23b"); // Business Specific - IBI
			exclusions.push("9b520fad0a0aa01100757d0a53bd4ffc"); // Business Specific - ITM
			exclusions.push("d1be70d60a0aa011000eeaf4ea3e3168"); // Cisco MeetMe
			exclusions.push("2ca96e423d0e34406fdc108358761098"); // Conferencing
			exclusions.push("8ba9e1e9753b8c80c626f148e44437f8"); // CutePDF
			exclusions.push("084f3b930a0aa01100bf11a09e83d075"); // Desk Phone
			exclusions.push("2c5e84430a0aa01101bfc9850dfaa681"); // Enterprise Vault UK
			exclusions.push("d1be71770a0aa011006354b21f07088e"); // Entourage
			exclusions.push("94efc4fe0a0aa011001f667a726d7cda"); // Epic Editor
			exclusions.push("2c4310090a0aa0110023ada761fd9975"); // Exchange Public Folders UK
			exclusions.push("d1be71c10a0aa011004b7ab068711b9d"); // Firefox
			exclusions.push("d1be720f0a0aa0110151a829cb9481ce"); // Google Apps
			exclusions.push("12ebbaa6259068009634b1d7d09b54d4"); // Google Chrome
			exclusions.push("22ac7c5c0a0aa011015567ff3291a5b8"); // Java
			exclusions.push("763691580a0aa01101c66d9dbd8f839c"); // Keyboard
			exclusions.push("ba569064a843e4409634d006f05602de"); // Laptop Docking Station
			exclusions.push("d1be73350a0aa01100ba19ba08cc787e"); // Microsoft Active Directory
			exclusions.push("c83613590a0aa01100fec40a82af1ff1"); // Microsoft Access 2010
			exclusions.push("d1be73400a0aa011005a2d45c5cfd793"); // Microsoft Excel
			exclusions.push("d1be735a0a0aa011006a5fe83a218ca7"); // Microsoft Exchange
			exclusions.push("71d7616c1958a544407e6585907f3624"); // Microsoft Internet Explorer 10
			exclusions.push("d1be73a00a0aa011019657b608dd2eeb"); // Microsoft Internet Explorer 9
			exclusions.push("d1be73950a0aa01101b9e6007cc648cd"); // Microsoft Internet Explorer 8
			exclusions.push("d1be73810a0aa01101579789b57c6174"); // Microsoft Internet Explorer
			exclusions.push("d1be73aa0a0aa011019056372808f373"); // Microsoft Live Messenger
			exclusions.push("f47c94604319d400963473cba24afccc"); // Microsoft Lync Online
			exclusions.push("6efd320e554464c896348ccfdc7a89b2"); // Microsoft Office 2003
			exclusions.push("c9d299840a0aa011019f6307ca7c48ef"); // Microsoft Office 2007
			exclusions.push("c832f17b0a0aa01100c29e8d5041ecc7"); // Microsoft Office 2010
			exclusions.push("9a55d98625a468409634b1d7d09b543a"); // Microsoft Office 365
			exclusions.push("47150aad20a47c80875f750ec43c5558"); // Microsoft Office 365 UK
			exclusions.push("c9d43c590a0aa01101b723e2d89b3224"); // Microsoft Outlook 2007
			exclusions.push("c835fb3f0a0aa01100f3b75a39bde9bb"); // Microsoft Outlook 2010
			exclusions.push("d1be73cc0a0aa01101bc5b39999bec44"); // Microsoft Outlook
			exclusions.push("d1be73e40a0aa01101b67f54747900d1"); // Microsoft PowerPoint
			exclusions.push("c9d476ef0a0aa011007369723917ab43"); // Microsoft PowerPoint 2007
			exclusions.push("c835d4e00a0aa01101de832611c91715"); // Microsoft Project 2010
			exclusions.push("d1be74240a0aa0110121150123e281b5"); // Microsoft Project
			exclusions.push("d1c11b5d0a0aa01100bf3588bbbe87f1"); // Microsoft Windows 7
			exclusions.push("d1be74490a0aa011007e44a4fdae05d4"); // Microsoft SQL
			exclusions.push("ab8d2caf0a0aa011016ba6610468d65b"); // MS SQL
			exclusions.push("763935160a0aa011001903445d763b7e"); // Mouse
			exclusions.push("d1be74b90a0aa01101c98fcfe18852ea"); // Mylearning
			exclusions.push("d1be74de0a0aa01101d587dbbdac0870"); // Network
			exclusions.push("ab8d2cb90a0aa011013c1ee3f5ea48c6"); // Oracle
			exclusions.push("153e40140a0aa01101958b681b389aa8"); // Projector
			exclusions.push("32abe30ae4ac5880c626f3a4dab99a2b"); // SAI - Online Security Training
			exclusions.push("22b3ec0a0a0aa0110100682193f633ce"); // Scanner
			exclusions.push("d1be76e40a0aa01101ad826f2a4ff767"); // Starters/leavers
			exclusions.push("cfbfea40e48c5400c626f3a4dab99a24"); // Starters/leavers UK
			exclusions.push("d1be77180a0aa01101d3e47cadd15e9e"); // Trace Call Logging
			exclusions.push("c696a965558860c896348ccfdc7a89d5"); // Twitter
			exclusions.push("d1be772a0a0aa011015616025353ed2b"); // VPN
			exclusions.push("d1be77450a0aa011005d87bf6ebb1f54"); // Webmail
			exclusions.push("e195a64455f95c0096348ccfdc7a8945"); // Yammer

        var sql = "user="+this.getSysId()+"^ci.sys_class_nameINcmdb_ci_appl,cmdb_ci_server,u_cmdb_ci_storage_server,cmdb_ci_web_site,cmdb_ci_acc,cmdb_ci_comm^u_active=true^ci.sys_idNOT IN" + exclusions.toString();
        return this.getAssociatedCIs(sql);
    },

    getAssociatedCIs: function (query) {         

        var output = [],
            gr = new GlideRecord("cmdb_rel_person");
            gr.addQuery("ci", "!=", "");
            gr.addQuery("user", this.getSysId());
        if (JSUtil.notNil(query) && typeof query == "string") gr.addEncodedQuery(query);
            gr.orderBy("ci.name");
            gr.query();
        while (gr.next()) {
            if (!gr.ci.nil()) {                              
                var oCI = new MT_CI(gr.ci);                
                if(oCI.isValid()) output.push(oCI);
            }
        }
        return output;
    },

    getAssociatedLicences: function (query) {       

        var output = [],
            gr = new GlideRecord("slm_license_usage_sys_user_m2m");
            gr.addQuery("license", "!=", "");
            gr.addQuery("user", this.getSysId());
        if (JSUtil.notNil(query) && typeof query == "string") gr.addEncodedQuery(query);
            gr.orderBy("license.number");
            gr.query();

        while (gr.next()) {
            if (!gr.ci.nil()) {
                var oLicense = new MT_License(gr.license);
                if(oLicense.isValid()) output.push(oLicense);
            }
        }
        return output;
    },

    type: 'MT_User'
});
