const ChartEngine = {
    currentType: 'bar',
    container: null,
    yAxis: null,
    
    setContainer: function(element) {
        this.container = element;
        this.yAxis = document.getElementById('graph-y-axis');
    },
    
    switchType: function(type, menus, counts) {
        this.currentType = type;
        this.init(menus);
        if(counts && Object.keys(counts).length > 0) {
            this.update(counts, menus);
        }
    },
    
    init: function(menus) {
        this.container.innerHTML = '';
        this.yAxis.innerHTML = '';
        const mainArea = document.getElementById('graph-main-area');
        mainArea.classList.remove('no-axis');

        switch(this.currentType) {
            case 'bar':
                this.yAxis.innerHTML = `<span>50</span><span>25</span><span>0</span>`;
                this.initBar(menus);
                break;
            case 'line':
                this.yAxis.innerHTML = `<span>50</span><span>25</span><span>0</span>`;
                this.initLine(menus);
                break;
            case 'scatter':
                this.initScatter(menus);
                break;
            case 'pie':
                mainArea.classList.add('no-axis');
                this.initPie(menus);
                break;
            case 'stacked':
                this.yAxis.innerHTML = `<span>100</span><span>50</span><span>0</span>`;
                this.initStacked(menus);
                break;
        }
    },
    
    update: function(counts, menus) {
        switch(this.currentType) {
            case 'bar': this.updateBar(counts, menus); break;
            case 'line': this.updateLine(counts, menus); break;
            case 'scatter': this.updateScatter(counts, menus); break;
            case 'pie': this.updatePie(counts, menus); break;
            case 'stacked': this.updateStacked(counts, menus); break;
        }
    },

    // ========== Bar Graph ==========
    initBar: function(menus) {
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-container';
        menus.forEach(menu => {
            const col = document.createElement('div');
            col.className = 'graph-col';
            col.innerHTML = `
                <div class="bar-wrapper" id="bar-wrapper-${menu.id}" data-id="${menu.id}">
                    <div id="bar-${menu.id}" class="bar" style="background-color: ${menu.color}"></div>
                </div>
                <div class="x-label">${createIconHTML(menu)}</div>
            `;
            wrapper.appendChild(col);
        });
        this.container.appendChild(wrapper);
    },
    updateBar: function(counts, menus) {
        let maxCount = 50;
        Object.values(counts).forEach(c => { if (c > maxCount) maxCount = c; });

        menus.forEach(menu => {
            const count = counts[menu.id] || 0;
            const percentage = (count / maxCount) * 100;
            const bar = document.getElementById(`bar-${menu.id}`);
            if(bar) {
                bar.style.height = `${percentage}%`;
            }
        });
        if (this.yAxis.children.length >= 3) {
            this.yAxis.children[0].innerText = maxCount;
            this.yAxis.children[1].innerText = Math.round(maxCount / 2);
        }
    },

    // ========== Stacked Graph ==========
    initStacked: function(menus) {
        const wrapper = document.createElement('div');
        wrapper.className = 'stacked-container';
        const stackWrapper = document.createElement('div');
        stackWrapper.className = 'stacked-bar-wrapper';
        menus.forEach(menu => {
            const seg = document.createElement('div');
            seg.className = 'stacked-segment';
            seg.id = `stacked-${menu.id}`;
            seg.style.backgroundColor = menu.color;
            stackWrapper.appendChild(seg);
        });
        wrapper.appendChild(stackWrapper);
        this.container.appendChild(wrapper);
    },
    updateStacked: function(counts, menus) {
        const total = 100;
        menus.forEach(menu => {
            const count = counts[menu.id] || 0;
            const percentage = (count / total) * 100; 
            const seg = document.getElementById(`stacked-${menu.id}`);
            if(seg) seg.style.height = `${percentage}%`;
        });
    },

    // ========== Pie Chart (CSS) ==========
    initPie: function(menus) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pie-container';
        const chart = document.createElement('div');
        chart.className = 'pie-chart';
        chart.id = 'pie-chart-elem';
        const legend = document.createElement('div');
        legend.className = 'pie-legend';
        menus.forEach(menu => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-color" style="background-color: ${menu.color}"></div>
                <div style="width:30px; height:30px; display:inline-block">${createIconHTML(menu)}</div>
            `;
            legend.appendChild(item);
        });
        wrapper.appendChild(chart);
        wrapper.appendChild(legend);
        this.container.appendChild(wrapper);
    },
    updatePie: function(counts, menus) {
        let total = 0;
        Object.values(counts).forEach(c => total += c);
        if(total === 0) return;
        
        let conicStr = '';
        let currentDeg = 0;
        menus.forEach((menu, index) => {
            const ratio = (counts[menu.id] || 0) / total;
            const degStr = `${currentDeg}deg ${currentDeg + (ratio * 360)}deg`;
            conicStr += `${menu.color} ${degStr}`;
            if(index < menus.length - 1) conicStr += ', ';
            currentDeg += ratio * 360;
        });
        
        const chart = document.getElementById('pie-chart-elem');
        if(chart) chart.style.background = `conic-gradient(${conicStr})`;
    },

    // ========== Line Graph ==========
    initLine: function(menus) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'svg-container');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('viewBox', '0 0 100 100');
        
        const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polyline.setAttribute('id', 'svg-line');
        polyline.setAttribute('class', 'svg-line');
        svg.appendChild(polyline);

        menus.forEach((m) => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('id', `dot-${m.id}`);
            circle.setAttribute('class', 'svg-dot');
            circle.setAttribute('r', '2.5');
            circle.setAttribute('fill', m.color);
            svg.appendChild(circle);
        });
        this.container.appendChild(svg);
    },
    updateLine: function(counts, menus) {
        let maxCount = 50;
        Object.values(counts).forEach(c => { if (c > maxCount) maxCount = c; });

        let points = [];
        menus.forEach((menu, i) => {
            const count = counts[menu.id] || 0;
            const x = (100 / (menus.length - 1)) * i;
            const y = 100 - (count / maxCount) * 95 - 2.5; // Adjust to keep dots inside
            
            const dot = document.getElementById(`dot-${menu.id}`);
            if(dot) {
                dot.setAttribute('cx', x);
                dot.setAttribute('cy', y < 0 ? 2.5 : y);
            }
            points.push(`${x},${y < 0 ? 2.5 : y}`);
        });
        
        const line = document.getElementById('svg-line');
        if(line) line.setAttribute('points', points.join(' '));

        if (this.yAxis.children.length >= 3) {
            this.yAxis.children[0].innerText = maxCount;
            this.yAxis.children[1].innerText = Math.round(maxCount / 2);
        }
    },

    // ========== Scatter Plot (Dummy) ==========
    initScatter: function(menus) {
        this.yAxis.innerHTML = `<span>見た目</span><span></span><span>味</span>`;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'svg-container');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.innerHTML = `
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4"/>
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4"/>
        `;
        menus.forEach(m => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('id', `scatter-dot-${m.id}`);
            circle.setAttribute('class', 'svg-dot');
            circle.setAttribute('fill', m.color);
            svg.appendChild(circle);
        });
        this.container.appendChild(svg);
    },
    updateScatter: function(counts, menus) {
        const svg = this.container.querySelector('.svg-container');
        if (!svg) return;
        const width = svg.clientWidth;
        const height = svg.clientHeight;

        const dummyPositions = {
            item1: { x: 0.8, y: 0.2 }, // Curry: 味◎, 見た目◎
            item2: { x: 0.3, y: 0.4 }, // Juice: 味〇, 見た目〇
            item3: { x: 0.6, y: 0.8 }, // Udon: 味△, 見た目〇
            item4: { x: 0.7, y: 0.3 }, // Burger: 味◎, 見た目◎
            item5: { x: 0.2, y: 0.1 }, // Ice: 味◎, 見た目△
        };

        menus.forEach(menu => {
            const count = counts[menu.id] || 0;
            const pos = dummyPositions[menu.id];
            const dot = document.getElementById(`scatter-dot-${menu.id}`);
            if(dot) {
                dot.setAttribute('cx', pos.x * width);
                dot.setAttribute('cy', pos.y * height);
                dot.setAttribute('r', 3 + count * 0.8);
            }
        });
    }
};