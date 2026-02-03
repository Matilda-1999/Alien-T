//0203-12

import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        const gridwidth = 12; 
        const gridheight = 8; 
        const themeColor = '#FF0000'; 

        // 0:┘(상,우), 1:└(우,하), 2:┌(하,좌), 3:┐(좌,상)
        const getOpenings = (tile) => {
            const rot = tile[1];
            if (tile[0] === 'S' || tile[0] === 'P' || tile[0] === 'E') return [rot];
            if (tile[0] === 'I') return [rot, (rot + 2) % 4];
            if (tile[0] === 'L') return [(rot + 2) % 4, (rot + 3) % 4]; // 시각적 ┘,└,┌,┐와 일치
            return [];
        };

        // 패턴 A
        const patternA = [
            // 구간 1: 시작(0,0) -> 포털1 입구(2,4)
            [0,0,'S',3], [0,1,'L',3], [1,1,'I',0], [2,1,'L',1], [2,2,'I',1], [2,3,'L',0], [2,4,'P',3,0], 
            
            // 구간 2: 포털1 출구(6,4) -> 포털2 입구(0,5)
            [6,4,'P',1,0], [6,5,'I',1], [6,6,'I',1], [6,7,'I',1], [6,8,'L',0], [5,8,'I',0], [4,8,'L',0], [4,7,'I',1], [4,6,'L',2], [5,6,'L',0], [5,5,'L',2], [5,4,'L',1], [4,3,'L',3], [3,3,'I',0], [2,3,'I',0], [1,3,'I',0], [0,3,'L',2], [0,4,'L',3], [0,5,'P',3,1],
            
            // 구간 3: 포털2 출구(5,8) -> 포털3 입구(3,7)
            [5,8,'P',0,1], [6,8,'I',0], [7,8,'L',0], [7,7,'I',1], [7,6,'I',1], [7,5,'I',1], [7,4,'L',1], [6,4,'I',0], [5,4,'I',0], [4,4,'I',0], [3,4,'I',0], [3,5,'I',1], [3,6,'L',1], [3,7,'P',1,2],
            
            // 구간 4: 포털3 출구(4,2) -> 종료(3,11)
            [4,2,'P',3,2], [4,3,'L',3], [5,3,'L',1], [5,4,'I',1], [5,5,'L',0], [4,5,'L',2], [4,6,'I',1], [4,7,'I',1], [4,8,'L',0], [3,8,'L',2], [3,9,'L',3], [3,10,'L',2], [3,11,'E',1]
        ];

        // 패턴 B
        const patternB = [
            // 구간 1: 시작(0,0) -> P1입(0,5) [L자 5개 사용]
            [0,0,'S',3], [0,1,'L',3], [1,1,'I',0], [1,2,'L',2], [1,3,'I',1], [1,4,'I',1], [1,5,'I',1], [1,6,'L',0], [0,6,'L',3], [0,5,'P',1,0],
            
            // 구간 2: P1출(7,0) -> P2입(4,9) [맵 하단 횡단]
            [7,0,'P',3,0], [7,1,'I',1], [7,2,'I',1], [7,3,'I',1], [7,4,'I',1], [7,5,'I',1], [7,6,'I',1], [7,7,'L',0], [6,7,'P',2,2], [4,9,'P',1,1],
            
            // 구간 3: P2출(2,3) -> P3입(6,7) [중앙 복합 경로]
            [2,3,'P',0,1], [3,3,'I',0], [4,3,'L',1], [4,4,'I',1], [6,7,'P',2,2],
            
            // 구간 4: P3출(4,5) -> 종료(5,11) [최종 우회]
            [4,5,'P',0,2], [5,5,'I',0], [6,5,'L',1], [6,6,'I',1], [6,8,'L',1], [6,9,'L',0], [5,9,'I',0], [7,11,'L',0], [6,11,'I',0], [5,11,'E',2]
        ];
        
        const selectedPattern = Math.random() < 0.5 ? patternA : patternB;
        const grid = ref([]);
        const poweredTiles = ref(new Set()); 

        for (let i = 0; i < gridheight; i++) {
            let row = [];
            for (let j = 0; j < gridwidth; j++) {
                let coord = `${i},${j}`;
                let p = selectedPattern.find(x => `${x[0]},${x[1]}` === coord);
                let type = p ? p[2] : (Math.random() < 0.5 ? 'I' : 'L');
                let ansRot = p ? p[3] : Math.floor(Math.random()*4);
                let rotation = p ? (ansRot + Math.floor(Math.random()*3)+1)%4 : ansRot;
                row.push([type, rotation, (p && (type==='S'||type==='E'||type==='P') ? 0 : 1), '', p ? p[4] : '', ansRot]);
            }
            grid.value.push(row);
        }

        const updatePower = () => {
            const active = new Set();
            const s = selectedPattern.find(p => p[2] === 'S');
            const e = selectedPattern.find(p => p[2] === 'E');
            const queue = [`${s[0]},${s[1]}`, `${e[0]},${e[1]}`]; // S와 E가 시작점
            
            while (queue.length > 0) {
                const curr = queue.shift();
                if (active.has(curr)) continue; active.add(curr);
                const [r, c] = curr.split(',').map(Number);
                const tile = grid.value[r][c];
                const openings = getOpenings(tile);

                if (tile[0] === 'P') {
                    const other = selectedPattern.find(p => p[2] === 'P' && p[4] === tile[4] && `${p[0]},${p[1]}` !== curr);
                    if (other) queue.push(`${other[0]},${other[1]}`);
                }

                openings.forEach(dir => {
                    let nr = r, nc = c;
                    if (dir===0) nr++; else if (dir===1) nc--; else if (dir===2) nr--; else if (dir===3) nc++;
                    if (nr>=0 && nr<gridheight && nc>=0 && nc<gridwidth) {
                        if (getOpenings(grid.value[nr][nc]).includes((dir+2)%4)) queue.push(`${nr},${nc}`);
                    }
                });
            }
            poweredTiles.value = active;
        };

        watch(grid, updatePower, { deep: true, immediate: true });

        return {
            grid, poweredTiles, themeColor,
            isGameWon: computed(() => {
                const s = selectedPattern.find(p => p[2] === 'S');
                const e = selectedPattern.find(p => p[2] === 'E');
                return poweredTiles.value.has(`${s[0]},${s[1]}`) && poweredTiles.value.has(`${e[0]},${e[1]}`) && selectedPattern.every(p => poweredTiles.value.has(`${p[0]},${p[1]}`));
            }),
            getNodeClass: (t, alt = false) => {
                const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node" };
                return m[t] || "";
            },
            getColour: (r, c) => (showAnswer || poweredTiles.value.has(`${r},${c}`)) ? themeColor : '',
            rotate: (t, r, c) => { if (t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1) % 4; },
            isCorrectPath: (r, c) => showAnswer && selectedPattern.some(p => p[0] === r && p[1] === c)
        };
    },
    template: `
    <div class="d-flex flex-column align-items-center">
        <h2 :style="{ opacity: isGameWon ? 1 : 0, color: themeColor }">무대 장치 가동 완료!</h2>
        <div v-for="(row, r) in grid">
            <div style="display: inline-block" v-for="(tile, c) in row">
                <div class="tile" :style="{ transform: 'rotate(' + (isCorrectPath(r, c) ? tile[5]*90 : tile[1]*90) + 'deg)', boxShadow: getColour(r,c) ? '0 0 15px '+themeColor : 'none', border: getColour(r,c) ? '2px solid '+themeColor : '1px solid #4a4d44' }" @click="rotate(tile, r, c)">
                    <div :style="{ backgroundColor: getColour(r, c) || '#d4af37' }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(r, c) || '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
                    <div class="circle-node" :style="{ backgroundColor: getColour(r, c) || '#d4af37', transform: 'rotate(' + (isCorrectPath(r, c) ? tile[5]*-90 : tile[1]*-90) + 'deg)' }"></div>
                    <div v-if="tile[0] == 'P'" class="portalsymbol active" :style="{ transform: 'rotate(' + (isCorrectPath(r, c) ? tile[5]*-90 : tile[1]*-90) + 'deg)' }">{{tile[4] + 1}}</div>
                </div>
            </div>
        </div>
    </div>`
}

