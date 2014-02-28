
function ServicesTab(id)
{
    this.url = Constants.URL__SERVICES;

    Tab.call(this, id);
}

ServicesTab.prototype = new Tab();

ServicesTab.prototype.constructor = ServicesTab;

ServicesTab.prototype.initialize = function()
{
    this.table = Table.createTable(
        this.id,
        this.getColumns(),
        this.getInitialSort(),
        $.proxy(this.clickHandler, this),
        [
            {
                text: "Turn Public",
                click: $.proxy(function()
                {
                    this.turnServices2Public()
                }, this)
            }
        ]);

    this.plansTable = Table.createTable("ServicesPlans", this.getPlansColumns(), [[0, "asc"]], null, null);
}

ServicesTab.prototype.getInitialSort = function()
{
    return [[0, "asc"]];
}

ServicesTab.prototype.getColumns = function()
{
    return [
        {
            "sTitle": "",
            "sClass": "cellCenterAlign",
            "bSortable": false,
            "mRender": function(value, type)
            {
                return '<input type="checkbox" value="' + value + '" onclick="ApplicationsTab.prototype.checkboxClickHandler(event)"></input>';
            }
        },
        {
            "sTitle":  "Name",
            "sWidth":  "100px"
        },
        {
            "sTitle":  "Provider",
            "sWidth":  "100px"
        },
        {
            "sTitle":  "Active",
            "sWidth":  "80px"
        },
        {
            "sTitle":  "Bindable",
            "sWidth":  "80px"
        },
        {
            "sTitle":  "Public",
            "sWidth":  "80px"
        },
        {
            "sTitle":  "Description",
            "sWidth":  "200px"
        }
    ];
}

ServicesTab.prototype.getPlansColumns = function()
{
    return [
        {
            "sTitle":  "Name",
            "sWidth":  "100px"
        },
        {
            "sTitle":  "Public",
            "sWidth":  "80px"
        },
        {
            "sTitle":  "Description",
            "sWidth":  "200px"
        }
    ];
}

ServicesTab.prototype.refresh = function(reload)
{
    var servicePlansDeferred     = Data.get(Constants.URL__SERVICE_PLANS,     reload);
    var servicesDeferred         = Data.get(Constants.URL__SERVICES,          reload);

    $.when(servicePlansDeferred, servicesDeferred).done($.proxy(function(servicePlansResult, servicesResult)
        {
            this.updateData([servicePlansResult, servicesResult], reload);
            this.plansTable.fnDraw();
        },
        this));
}

ServicesTab.prototype.getTableData = function(results)
{
    var plans    = results[0].response.items;
    var services = results[1].response.items;

    var tableData = [];

    for(var index in services)
    {
        var service = services[index];
        var row = [];

        row.push(service.guid)
        row.push(service.label);
        row.push(service.provider);
        row.push(service.active);
        row.push(service.bindable);
        row.push(false);
        row.push(service.description);
        row.push(service);

        var service_plans = [];
        for(var inner_index in plans)
        {
            var plan = plans[inner_index];
            if(plan.service_guid == service.guid)
            {
               service_plans.push(plan);
            }
        }

        row.push(service_plans);

        for(var index in service_plans)
        {
            plan = service_plans[index];
            if(plan.public){
                row[5] = true;
                break;
            }
        }

        tableData.push(row);
    }

    return tableData;
}

ServicesTab.prototype.clickHandler = function()
{
    var tableTools = TableTools.fnGetInstance("ServicesTable");

    var selected = tableTools.fnGetSelectedData();

    this.hideDetails();

    $("#ServicesDetailsLabel").hide();
    $("#ServicesPlansLabel").hide();
    $("#ServicesPlansTableContainer").hide();

    if (selected.length > 0)
    {
        $("#ServicesDetailsLabel").show();
        $("#ServicesPlansLabel").show();
        $("#ServicesPlansTableContainer").show();

        var containerDiv = $("#ServicesPropertiesContainer").get(0);

        var table = this.createPropertyTable(containerDiv);

        var service = selected[0][7];

        this.addPropertyRow(table, "Name",         service.label, true);
        if(service.version)
        {
            this.addPropertyRow(table, "Version",      service.version);
        }
        if(service.tags)
        {
            this.addPropertyRow(table, "tags",         service.tags.join(','));
        }
        if(service.long_description)
        {
            this.addPropertyRow(table, "Description",  Format.formatString(service.long_description));
        }
        this.addPropertyRow(table, "Created",      Format.formatDateString(service.created_at));
        if(service.updated_at)
        {
            this.addPropertyRow(table, "Updated",  Format.formatDateString(service.updated_at));
        }

        var plans = selected[0][8];

        var tableData = [];

        for (var index in plans)
        {
            var plan = plans[index];

            var planRow = [];

            planRow.push(plan.name);
            planRow.push(plan.public);
            planRow.push(plan.description);

            tableData.push(planRow);
        }

        this.plansTable.fnClearTable();
        this.plansTable.fnAddData(tableData);
    }
}

ServicesTab.prototype.turnServices2Public = function()
{
    var services = this.getSelectedServices();

    if(!services || services.length == 0)
    {
        return;
    }

    if(!confirm("This operation will turn all the service plans under the selected services to public.\nAre you sure?"))
    {
        return;
    }

    AdminUI.showModalDialog("Taking operation, please wait...");

    var error_services = [];

    for(var step = 0;step < services.length;step ++)
    {
        var service = services[step];
        var url = "/turn_service_2_public?service_guid=" + service;
        $.ajax({
            type: 'PUT',
            async: false,
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {},
            error: function (msg)
            {
                error_services.push(service);
            }
        });
    }

    AdminUI.closeModalDialog();

    if(error_services.length > 0)
    {
        alert("Error handling the follwoing services:\n" + error_services);
    }
    else
    {
        alert("The operation is finished without errors.");
    }

    AdminUI.refresh();
}

ServicesTab.prototype.getSelectedServices = function()
{
    var checkedRows = $("input:checked", this.table.fnGetNodes());

    if(checkedRows.length == 0)
    {
        alert("Please select at least one row!");
        return null;
    }

    var services = [];

    for(var step = 0;step < checkedRows.length;step ++)
    {
        services.push(checkedRows[step].value);
    }

    return services;
}

