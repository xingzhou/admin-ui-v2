function RoutesTab(id)
{
    this.url = Constants.URL__ROUTES;
    Tab.call(this, id);
}

RoutesTab.prototype = new Tab();

RoutesTab.prototype.constructor = RoutesTab;

RoutesTab.prototype.checkboxClickHandler = function(event)
{
    event.stopPropagation();
}

RoutesTab.prototype.initialize = function()
{
    this.table = Table.createTable(
        this.id,
        this.getColumns(),
        this.getInitialSort(),
        $.proxy(this.clickHandler, this),
        [
            {
                text: "Delete",
                click: $.proxy(function()
                {
                    this.manageRoutes("/route", "DELETE");
                }, this)
            }
        ]);
}

RoutesTab.prototype.getColumns = function()
{
    return [
        {
            "sTitle": "&nbsp;",
            "sClass": "cellCenterAlign",
            "bSortable": false,
            "mRender": function(value, type)
            {
                return '<input type="checkbox" value="' + value + '" onclick="RoutesTab.prototype.checkboxClickHandler"></input>';
            }
        },
        {
            "sTitle":  "Host",
            "sWidth":  "200px"
        },
        {
            "sTitle":  "Domain",
            "sWidth":  "200px",
            "sClass":  "cellLeftAlign",
            "mRender": Format.formatString
        },
        {
            "sTitle":  "Application",
            "sWidth":  "200px",
            "sClass":  "cellLeftAlign",
            "mRender": Format.formatString
        }
    ];
}

RoutesTab.prototype.updateTableRow = function(row, route)
{
    console.log("route data:" + route);
    row.push(route.host + '.' + route.domain.entity.name);
    row.push(route.host);
    row.push(route.domain.entity.name);
    row.push(route.apps[0].entity.name);
}

RoutesTab.prototype.manageRoutes = function(path, method)
{
    var routes = this.getSelectedRoutes();

    if(!routes || routes.length == 0)
    {
        return;
    }

    if(!confirm("Are you sure to delete the selected routes?"))
    {
        return;
    }

    AdminUI.showModalDialog("Taking routes, please wait...");

    var error_routes = [];

    for(var step = 0;step < routes.length;step ++)
    {
        var route = routes[step];
        var url = path + "?route=" + route;
        $.ajax(
            {
                type: method,
                async: false,
                url: url,
                contentType: "route/json; charset=utf-8",
                dataType: "json",
                success: function (data) {},
                error: function (msg)
                {
                    error_routes.push(route);
                }
            });
    }

    AdminUI.closeModalDialog();

    if(error_routes.length > 0)
    {
        alert("Error handling the follwoing routes:\n" + error_routes);
    }
    else
    {
        alert("The operation is finished without errors.");
    }

    AdminUI.refresh();
}

RoutesTab.prototype.getSelectedRoutes = function()
{
    var checkedRows = $("input:checked", this.table.fnGetNodes());

    if(checkedRows.length == 0)
    {
        alert("Please select at least one row!");
        return null;
    }

    var routes = [];

    for(var step = 0;step < checkedRows.length;step ++)
    {
        routes.push(checkedRows[step].value);
    }

    return routes;
}