# ag-grid-conf

This is an example of how to save columns state of an ag-grid table. It is not using getColumnState() as I'm only interested of keeping track of changes. You set the column of your grid and then it's applying user configuration.

# Grid configuration
For the grid just add the directive:
```
<div ag-grid-conf ag-grid="agGrid.gridOptions"></div>
```

# [Optional] Saved query with/without grid configuration
If you have criteria to specify and then a button to click to launch a query that will display results into the ag-grid table,
you can transform a button into a dropdown button which can save a query (including or not column state), you will be asked to name it and then you will retrieve you saved query into the dropdown.

For this, this is how you transform your button:
```
<conf-button>
  <button type="button" class="btn btn-success btn-lg" ng-click="launchQuery()">Launch query</button>
</conf-button>
```

# Limitations
This repo doesn't include the backend web service to handle it (not yet).

For now it's only handling:
* column resized
* column sorted
* column moved
* column showed/hidden
