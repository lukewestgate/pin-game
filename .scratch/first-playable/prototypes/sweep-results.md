# Headless sweep, sorting-rules prototype (2026-11-15)

Generated layered Models: 6 Pins per colour, 4 layers, Capacity 3, 10 seeds per cell, solver budget 40k positions, 100 random playouts. Throwaway evidence for the Sorting rules logic prototype ticket.

```

== buffer 7, rule uniform (cell: proven winnable/10 [?=gave up] · random-tap win %)
colours   3 boxes               4 boxes               5 boxes               
4         10/10 · 100%          10/10 · 100%          10/10 · 100%          
5         10/10 · 87%           10/10 · 100%          10/10 · 100%          
6         10/10 · 23%           10/10 · 94%           10/10 · 100%          
7         10/10 · 4%            10/10 · 53%           10/10 · 97%           
8         9/10 [1?] · 0%        10/10 · 5%            10/10 · 52%           
9         10/10 · 0%            10/10 · 2%            10/10 · 19%           
10        5/10 [5?] · 0%        8/10 [2?] · 0%        10/10 · 2%            
11        3/10 [7?] · 0%        7/10 [3?] · 0%        10/10 · 0%            

== buffer 7, rule reachable-first (cell: proven winnable/10 [?=gave up] · random-tap win %)
colours   3 boxes               4 boxes               5 boxes               
4         10/10 · 100%          10/10 · 100%          10/10 · 100%          
5         10/10 · 89%           10/10 · 100%          10/10 · 100%          
6         10/10 · 48%           10/10 · 98%           10/10 · 100%          
7         10/10 · 13%           10/10 · 79%           10/10 · 100%          
8         10/10 · 2%            10/10 · 29%           10/10 · 83%           
9         10/10 · 0%            10/10 · 4%            10/10 · 43%           
10        10/10 · 0%            10/10 · 1%            10/10 · 19%           
11        10/10 · 0%            10/10 · 0%            9/10 [1?] · 3%        

== buffer 7, rule buffer-first (cell: proven winnable/10 [?=gave up] · random-tap win %)
colours   3 boxes               4 boxes               5 boxes               
4         10/10 · 100%          10/10 · 100%          10/10 · 100%          
5         10/10 · 99%           10/10 · 100%          10/10 · 100%          
6         10/10 · 69%           10/10 · 99%           10/10 · 100%          
7         10/10 · 26%           10/10 · 84%           10/10 · 100%          
8         10/10 · 2%            10/10 · 35%           10/10 · 71%           
9         10/10 · 0%            10/10 · 11%           10/10 · 54%           
10        10/10 · 0%            10/10 · 1%            10/10 · 19%           
11        9/10 [1?] · 0%        10/10 · 0%            10/10 · 1%            

== buffer 5, rule uniform (cell: proven winnable/10 [?=gave up] · random-tap win %)
colours   3 boxes               4 boxes               5 boxes               
4         10/10 · 89%           10/10 · 100%          10/10 · 100%          
5         9/10 · 48%            10/10 · 100%          10/10 · 100%          
6         10/10 · 2%            10/10 · 65%           10/10 · 100%          
7         10/10 · 0%            10/10 · 15%           10/10 · 67%           
8         7/10 · 0%             10/10 · 1%            10/10 · 19%           
9         8/10 [1?] · 0%        10/10 · 0%            10/10 · 3%            
10        5/10 [3?] · 0%        6/10 [3?] · 0%        9/10 [1?] · 0%        
11        2/10 [6?] · 0%        5/10 [4?] · 0%        10/10 · 0%            

== buffer 5, rule reachable-first (cell: proven winnable/10 [?=gave up] · random-tap win %)
colours   3 boxes               4 boxes               5 boxes               
4         10/10 · 99%           10/10 · 100%          10/10 · 100%          
5         10/10 · 72%           10/10 · 100%          10/10 · 100%          
6         10/10 · 15%           10/10 · 79%           10/10 · 100%          
7         10/10 · 1%            10/10 · 39%           10/10 · 96%           
8         10/10 · 0%            10/10 · 6%            10/10 · 53%           
9         10/10 · 0%            10/10 · 1%            10/10 · 15%           
10        10/10 · 0%            10/10 · 0%            10/10 · 3%            
11        9/10 [1?] · 0%        10/10 · 0%            9/10 [1?] · 0%        

== buffer 5, rule buffer-first (cell: proven winnable/10 [?=gave up] · random-tap win %)
colours   3 boxes               4 boxes               5 boxes               
4         10/10 · 100%          10/10 · 100%          10/10 · 100%          
5         10/10 · 85%           10/10 · 100%          10/10 · 100%          
6         10/10 · 32%           10/10 · 87%           10/10 · 100%          
7         10/10 · 4%            10/10 · 46%           10/10 · 94%           
8         10/10 · 0%            10/10 · 8%            10/10 · 39%           
9         10/10 · 0%            10/10 · 1%            10/10 · 20%           
10        10/10 · 0%            10/10 · 0%            10/10 · 2%            
11        8/10 [1?] · 0%        9/10 · 0%             10/10 · 0%            
```

## Sweep 2: lose when the Buffer fills (decided 2026-11-15), 3 / 3 / 5 against nearby settings

12 seeds per cell, 4 layers, solver budget 40k. Cell: proven UNwinnable / 12 [? = solver gave up] · random-tap win %. Note sweep 1 above used the old rule (lose on the Pin after the Buffer is full).

```

== 6 Pins per colour, rule uniform. Cell: unwinnable/12 [?=gave up] · random-tap win %
colours  3box/buf5        3box/buf6        3box/buf7        4box/buf5        5box/buf7        
3        0 · 100%         0 · 100%         0 · 100%         0 · 100%         0 · 100%         
4        0 · 82%          0 · 91%          0 · 100%         0 · 100%         0 · 100%         
5        1 · 32%          1 · 51%          0 · 74%          0 · 96%          0 · 100%         
6        2 · 0%           0 · 1%           0 · 7%           0 · 37%          0 · 100%         
7        3 · 0%           0 [1?] · 0%      0 · 0%           0 · 4%           0 · 87%          
8        3 · 0%           3 · 0%           0 [1?] · 0%      1 · 0%           0 · 37%          
9        3 [3?] · 0%      1 [3?] · 0%      0 [1?] · 0%      0 [1?] · 0%      0 · 12%          

== 6 Pins per colour, rule reachable-first. Cell: unwinnable/12 [?=gave up] · random-tap win %
colours  3box/buf5        3box/buf6        3box/buf7        4box/buf5        5box/buf7        
3        0 · 100%         0 · 100%         0 · 100%         0 · 100%         0 · 100%         
4        0 · 98%          0 · 99%          0 · 100%         0 · 100%         0 · 100%         
5        0 · 56%          0 · 71%          0 · 82%          0 · 100%         0 · 100%         
6        0 · 8%           0 · 17%          0 · 31%          0 · 64%          0 · 100%         
7        0 [1?] · 0%      0 · 1%           0 · 4%           0 · 16%          0 · 99%          
8        2 · 0%           0 · 0%           0 · 0%           0 · 1%           0 · 70%          
9        0 [1?] · 0%      0 · 0%           0 · 0%           0 · 0%           0 · 30%          

== 6 Pins per colour, rule buffer-first. Cell: unwinnable/12 [?=gave up] · random-tap win %
colours  3box/buf5        3box/buf6        3box/buf7        4box/buf5        5box/buf7        
3        0 · 100%         0 · 100%         0 · 100%         0 · 100%         0 · 100%         
4        0 · 96%          0 · 100%         0 · 100%         0 · 100%         0 · 100%         
5        0 · 71%          0 · 87%          0 · 97%          0 · 98%          0 · 100%         
6        0 · 12%          0 · 28%          0 · 46%          0 · 66%          0 · 100%         
7        0 · 0%           0 · 4%           0 · 14%          0 · 20%          0 · 99%          
8        0 · 0%           0 · 0%           0 · 1%           0 · 3%           0 · 61%          
9        0 · 0%           0 · 0%           0 · 0%           0 · 0%           0 · 39%          

== 9 Pins per colour, rule uniform. Cell: unwinnable/12 [?=gave up] · random-tap win %
colours  3box/buf5        3box/buf6        3box/buf7        4box/buf5        5box/buf7        
3        0 · 100%         0 · 100%         0 · 100%         0 · 100%         0 · 100%         
4        0 · 67%          0 · 85%          0 · 97%          0 · 100%         0 · 100%         
5        0 · 14%          0 · 36%          0 · 58%          0 · 80%          0 · 100%         
6        1 · 0%           0 · 1%           0 · 3%           0 · 12%          0 · 98%          
7        1 [1?] · 0%      1 [1?] · 0%      0 · 0%           0 · 1%           0 · 71%          
8        0 [3?] · 0%      0 [4?] · 0%      0 [3?] · 0%      0 [1?] · 0%      0 · 17%          
9        1 [8?] · 0%      0 [6?] · 0%      0 [4?] · 0%      0 [4?] · 0%      0 [1?] · 1%      

== 9 Pins per colour, rule reachable-first. Cell: unwinnable/12 [?=gave up] · random-tap win %
colours  3box/buf5        3box/buf6        3box/buf7        4box/buf5        5box/buf7        
3        0 · 100%         0 · 100%         0 · 100%         0 · 100%         0 · 100%         
4        0 · 79%          0 · 92%          0 · 99%          0 · 100%         0 · 100%         
5        0 · 22%          0 · 46%          0 · 67%          0 · 92%          0 · 100%         
6        0 · 1%           0 · 4%           0 · 12%          0 · 40%          0 · 100%         
7        0 · 0%           0 · 0%           0 · 0%           0 · 5%           0 · 91%          
8        0 · 0%           0 · 0%           0 · 0%           0 · 0%           0 · 34%          
9        0 · 0%           0 · 0%           0 · 0%           0 · 0%           0 · 9%           

== 9 Pins per colour, rule buffer-first. Cell: unwinnable/12 [?=gave up] · random-tap win %
colours  3box/buf5        3box/buf6        3box/buf7        4box/buf5        5box/buf7        
3        0 · 100%         0 · 100%         0 · 100%         0 · 100%         0 · 100%         
4        0 · 91%          0 · 97%          0 · 100%         0 · 100%         0 · 100%         
5        0 · 39%          0 · 65%          0 · 82%          0 · 98%          0 · 100%         
6        0 · 4%           0 · 13%          0 · 29%          0 · 53%          0 · 100%         
7        0 · 0%           0 · 1%           0 · 4%           0 · 11%          0 · 94%          
8        0 · 0%           0 · 0%           0 · 0%           0 · 0%           0 · 59%          
9        0 · 0%           0 · 0%           0 · 0%           0 · 0%           0 · 28%          
```
