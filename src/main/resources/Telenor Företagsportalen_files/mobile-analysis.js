(function($){    
    
    var pieChartOptions = { is3D: true,
                            width: 437,
                            height: 300 };

    var columnChartOptions = {
                    'title': 'Total kostnad (exkl. moms)',
                    'width': 890,
                    'height': 300,
                    'legend': 'none',
                    'animation': { startup: true,
                                   duration: 1000,
                                   easing: 'linear'}
            };
    
    this.mobileAnalysis = {loadGroupAnalysisData : function () {
        $.get('http://localhost:8080/mobileAnalysis/org/1', function (data) { 
            var orgTotalsData = extractOrgTotalsData(data);
            populateOrgTotalsReport(orgTotalsData);
            populateOrgTotalsCharts(orgTotalsData);
            populatePeriodicCostsCharts(orgTotalsData);
        });    
    }};
    
    
    
    function populatePeriodicCostsCharts(data) {
        var columnChart = new google.visualization.ColumnChart(document.getElementById('overview_col_chart'));
        var stackedGroupChart = new google.visualization.ColumnChart(document.getElementById('group_activity_per_month_chart'));
        var userPieChart = new google.visualization.PieChart(document.getElementById('user_activity_per_month_chart'));
        var arrayData = [["Månad","Samtalslängd","Kostnad"]];
        $(Object.getOwnPropertyNames(data.monthlyCalls).sort()).each(function(index, monthYear){
            arrayData.push([monthYear,data.monthlyCalls[monthYear],Number((data.monthlyCalls[monthYear] * data.costs.call).toFixed(2))]);
        });
        
        var columnChartData = google.visualization.arrayToDataTable(arrayData);
        var columnChartView = new google.visualization.DataView(columnChartData);
        
        columnChartView.setColumns([0,2]);
        
        google.visualization.events.addListener(columnChart, 'select', function selectHandler() {
            var selectedItem = columnChart.getSelection()[0];
            var stackedGroupChartOptions = {
                isStacked: true,
                width: 437,
                height: 300,
                hAxis: {
                    textPosition: 'none',
                    gridlines: {
                        color: 'none'
                    }
                },
                vAxis: {
                    gridlines: {
                        color: 'none'
                    },
                    textPosition: 'none',
                },
                minValue: 0
            };
            if (selectedItem) {
                var selectedColumn = columnChartData.getValue(selectedItem.row, 0);
                var monthlyGroupData = getMonthlyDataByGroup(data,selectedColumn);
                
                var monthlyGroupView = new google.visualization.DataView(monthlyGroupData);
                monthlyGroupView.setColumns([0,1]);
                stackedGroupChart.draw(monthlyGroupData,google.charts.Bar.convertOptions(stackedGroupChartOptions));
                
                var monthlyUserData = google.visualization.arrayToDataTable(getMonthlyUserDataTable(data,selectedColumn));
                userPieChart.draw(monthlyUserData, {pieHole: 0.4});
            }
            
            function getMonthlyUserDataTable(data, monthYear){
                var arrayData = [['Gruppnamn', 'Månadssamtalskostnaden']];
                
                $(Object.getOwnPropertyNames(data.callsByMonth[monthYear].user).sort()).each(function(index, userName){
                    arrayData.push([userName,Number((data.callsByMonth[monthYear].user[userName].duration * data.costs.call).toFixed(2))]);
                });
                
                return arrayData;
            }

            function getMonthlyDataByGroup(data, monthYear){
                var monthlyUserData =new google.visualization.DataTable(); ;
                var arrayData = ['Månads användare samtalsavgifter'];
                monthlyUserData.addColumn('string', 'Gruppnamn');

                $(Object.getOwnPropertyNames(data.callsByMonth[monthYear].group).sort()).each(function(index, groupName){
                        monthlyUserData.addColumn('number', groupName);
                        arrayData.push(Number((data.callsByMonth[monthYear].group[groupName].duration * data.costs.call).toFixed(2)));
                });
                monthlyUserData.addRow(arrayData);
                return monthlyUserData;
            }
        });
        
        columnChart.draw(new google.visualization.DataView(columnChartView), columnChartOptions);      
    }

    
    
    function populateOrgTotalsCharts(data){
        var pieChart = new google.visualization.PieChart(document.getElementById('overview_pie_chart'));
        var pieChartData = google.visualization.arrayToDataTable([
            ["", "Kostnad"],
            ["Periodiska kostnade", data.costs.periodic],
            ["Engångskostnader", data.costs.oneOffCost],
            ["Övriga", data.costs.other]
            ]);
        pieChart.draw(pieChartData, pieChartOptions);
    }

    function populateOrgTotalsReport(data){
        var date = new Date(null);
        date.setSeconds(data.totalDuration);
        
        var orgTotalsTable = $('table#org-cost tbody');
        
        orgTotalsTable.append($("<tr class='call-costs'><td>Samtal:</td><td><span class='cost'>" + data.costs.call+ 
                                "</span><span class='currency'> kr</span></td>" +
                                "<td><span class='credit'>"+data.credit.call.toFixed(2) +"</span><span class='currency'> kr</span></td></tr>"));
        
        orgTotalsTable.append($("<tr class='periodic-costs'><td>Periodiska kostnader:</td><td><span class='cost'>" + data.costs.periodic.toFixed(2) + 
                                "</span><span class='currency'> kr</span></td>" +
                                "<td><span class='credit'>" + data.credit.periodic.toFixed(2) +"</span><span class='currency'> kr</span></td></tr>"));
        
        orgTotalsTable.append($("<tr class='one-off-costs'><td>Engångskostnader:</td><td><span class='cost'>" + data.costs.oneOffCost.toFixed(2) + 
                                "</span><span class='currency'> kr</span></td>" +
                                "<td><span class='credit'>" + data.credit.oneOffCost.toFixed(2) +"</span><span class='currency'> kr</span></td></tr>"));
        orgTotalsTable.append($("<tr class='one-off-costs'><td>Övriga:</td><td><span class='cost'>" + data.costs.other.toFixed(2) + 
                                "</span><span class='currency'> kr</span></td>" +
                                "<td></td></tr>"));
        
        orgTotalsTable.append($("<tr style='height: 70px;'></tr>"));
        
      
        orgTotalsTable.append($("<tr class='total-costs'><td>Total kostnad:</td><td><span class='cost'>" + data.totalCost.toFixed(2) + 
                                "</span><span class='currency'> kr</span></td><td></td></tr>"));
        
        orgTotalsTable.append($("<tr class='total-call-amount'><td>Totalt antal samtal:</td><td><span class='amount'>" + data.totalCalls + 
                                "</span></td><td></td></tr>"));
        
          
        orgTotalsTable.append($("<tr class='total-call-duration'><td>Total samtalslängd:</td><td><span class='duration'>" +date.toISOString().substr(11, 8) + 
                                "</span></td><td></td></tr>"));
       
    }
    
    function extractOrgTotalsData(responseData){
        var orgUserData = { totalUsers: 0,
                            totalCalls: 0,
                            totalDuration: 0,
                            monthlyCalls: {},
                            callsByMonth: {}
                          };
        
        $.each(responseData.userGroups,function(ind,val){
            orgUserData.totalUsers = orgUserData.totalUser + val.users.length;
            var groupName = val.name;
            $.each(val.users,function(ind,usr) {   
                orgUserData.totalCalls = orgUserData.totalCalls + usr.calls.length
                var usrName = usr.name;
                $.each(usr.calls, function(ind,call) {
                    var duration = Math.ceil(Number(call.duration)/60);
                    var monthYear =  call.date[0]+"-"+(call.date[1] < 10 ? "0" : "") + call.date[1];
                    
                    if(orgUserData.monthlyCalls.hasOwnProperty(monthYear)) {
                        orgUserData.monthlyCalls[monthYear] = orgUserData.monthlyCalls[monthYear] + duration; 
                    } else {
                        orgUserData.monthlyCalls[monthYear] = duration;
                    }
                    
                    if(!orgUserData.callsByMonth.hasOwnProperty(monthYear)){
                        orgUserData.callsByMonth[monthYear]={group:{},
                                                             user:{}};
                    }
                    
                    if(!orgUserData.callsByMonth[monthYear].group.hasOwnProperty(groupName)){
                        orgUserData.callsByMonth[monthYear].group[groupName]={duration: 0};
                    }
                       
                    if(!orgUserData.callsByMonth[monthYear].user.hasOwnProperty(usrName)){
                        orgUserData.callsByMonth[monthYear].user[usrName]={duration: 0};
                    }
                    orgUserData.callsByMonth[monthYear].group[groupName].duration = orgUserData.callsByMonth[monthYear].group[groupName].duration +duration;
                    orgUserData.callsByMonth[monthYear].user[usrName].duration = orgUserData.callsByMonth[monthYear].user[usrName].duration +duration;
                    orgUserData.totalDuration = orgUserData.totalDuration + Number(call.duration);
                });   
            });
        });
        
        orgUserData.costs = {};
        orgUserData.credit = {};
        
        orgUserData.costs.call = 8.40 ;
        orgUserData.costs.periodic = 155830.00;
        orgUserData.costs.oneOffCost = 33670.00;
        orgUserData.costs.other = 60966.80;
        
        orgUserData.credit.call = 0.00;
        orgUserData.credit.periodic = 0.00;
        orgUserData.credit.oneOffCost = -424.80;
        orgUserData.totalCost = orgUserData.costs.periodic + orgUserData.costs.oneOffCost + orgUserData.credit.oneOffCost;
        
        return orgUserData;
    }
    
})(jQuery);