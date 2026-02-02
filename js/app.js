//0203-11

import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        
        const gridwidth = 12; 
        const gridheight = 8; 
        const themeColor = '#FF0000'; // 빨간색 전류 고정

        // [물리 연결 기준]
        // 직선(I): 0:↕, 1:↔
        // L자(L): 0:┘(위오), 1:└(오아), 2:┌(아왼), 3:┐(왼위)
        // 포털(P)/S/E: 전선 방향 (0:하, 1:좌, 2:상, 3:우)

        // 패턴 A: 표로 확인한 설계도 반영
        const patternA = [
            [0,0,'S',3], [0,1,'L',1], [1,1,'L',3], [1,2,'I',1], [0,2,'L',1], [0,3,'L',2], [1,3,'I',0], [2,3,'P',2,0],
            [3,8,'P',0,0], [4,8,'L',0], [4,9,'L',2], [5,9,'L',0], [5,10,'L',2], [6,10,'P',2,1],
            [4,2,'P',3,1], [4,3,'L',1], [5,3,'L',3], [5,4,'L',1], [6,4,'L',3], [6,5,'P',1,2],
            [7,0,'P',3,2], [7,1,'L',0], [7,2,'I',1], [7,3,'L',2], [6,3,'L',0], [6,4,'L',2], [7,4,'L',0], [7,5,'I',1], [7,6,'L',3], [6,6,'I',0], [5,6,'L',1], [5,7,'I',1], [5,8,'I',1], [5,9,'I',1], [5,10,'I',1], [3,11,'E',1]
        ];

        // 패턴 B: 표로 확인한 설계도 반영
        const patternB = [
            [0,0,'S',3], [0,1,'L',1], [1,1,'L',3], [1,2,'L',1], [2,2,'L',3], [2,3,'L',2], [3,3,'P',2,0],
            [0,5,'P',0,0], [1,5,'L',2], [1,4,'I',1], [1,3,'I',1], [1,2,'L',3], [1,1,'I',0], [2,1,'I',0], [3,1,'P',2,1],
            [3,1,'P',3,1], [4,1,'I',0], [5,1,'L',0], [5,2,'I',1], [5,3,'I',1], [5,4,'P',1,2],
            [7,0,'P',3,2], [7,1,'L',0], [7,2,'I',1], [7,3,'I',1], [7,4,'I',1], [7,5,'I',1], [7,6,'I',1], [7,7,'I',1], [7,8,'I',1], [7,9,'L',3], [6,9,'L',1], [6,10,'I',1], [6,11,'L',3], [5,11,'E',2]
        ];

        const selectedPattern = Math.random() < 0.5 ? patternA : patternB;
        const grid = ref([]);
        const poweredTiles = ref(new Set()); 

        // 그리드 초기화 (정답 각도 주입)
        for (let i = 0; i < gridheight; i++) {
            let row = [];
            for (let j = 0; j < gridwidth; j++) {
                let coord = `${i},${j}`;
                let pNode = selectedPattern.find(p => `${p[0]},${p[1]}` === coord);
                let type = pNode ? pNode[2] : (Math.random() < 0.3 ? 'D' : (Math.random() < 0.6 ? 'I' : 'L'));
                let ansRot = pNode ? pNode[3] : Math.floor(Math.random() * 4);
                let rotation = pNode ? (ansRot + Math.floor(Math.random() * 3) + 1) % 4 : ansRot;
                row.push([type, rotation, (type === 'P' || type === 'S' || type === 'E' ? 0 : 1), '', pNode ? pNode[4] : '', ansRot]);
            }
            grid.value.push(row);
        }

        // [보정 완료] L자 및 타일별 열린 방향 계산
        const getOpenings = (tile) => {
            const rot = tile[1];
            if (tile[0] === 'S' || tile[0] === 'P' || tile[0] === 'E') return [rot];
            if (tile[0] === 'I') return [rot, (rot + 2) % 4];
            if (tile[0] === 'L') return [(rot + 2) % 4, (rot + 3) % 4]; // 0:┘일 때 2(상), 3(우)
            return [];
        };

        // 실시간 전류 전파 (양방향)
        const updatePower = () => {
            const active = new Set();
            const start = selectedPattern.find(p => p[2] === 'S');
            const end = selectedPattern.find(p => p[2] === 'E');
            const queue = [`${start[0]},${start[1]}`, `${end[0]},${end[1]}`]; // 시작점과 끝점 동시 시작
            
            while (queue.length > 0) {
                const curr = queue.shift();
                if (active.has(curr)) continue; active.add(curr);
                const [r, c] = curr.split(',').map(Number);
                const tile = grid.value[r][c];
                const myOpenings = getOpenings(tile);

                if (tile[0] === 'P') {
                    const other = selectedPattern.find(p => p[2] === 'P' && p[4] === tile[4] && `${p[0]},${p[1]}` !== curr);
                    if (other) queue.push(`${other[0]},${other[1]}`);
                }

                myOpenings.forEach(dir => {
                    let nr = r, nc = c;
                    if (dir === 0) nr++; else if (dir === 1) nc--; else if (dir === 2) nr--; else if (dir === 3) nc++;
                    if (nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth) {
                        if (getOpenings(grid.value[nr][nc]).includes((dir + 2) % 4)) queue.push(`${nr},${nc}`);
                    }
                });
            }
            poweredTiles.value = active;
        };

        watch(grid, updatePower, { deep: true, immediate: true });

        const isGameWon = computed(() => {
            const s = selectedPattern.find(p => p[2] === 'S');
            const e = selectedPattern.find(p => p[2] === 'E');
            // 시작점의 전류와 끝점의 전류가 만났는지 확인
            return poweredTiles.value.has(`${s[0]},${s[1]}`) && poweredTiles.value.has(`${e[0]},${e[1]}`) &&
                   selectedPattern.every(p => poweredTiles.value.has(`${p[0]},${p[1]}`));
        });

        return {
            grid, poweredTiles, themeColor, isGameWon,
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
        <h2 class="grandiflora-one-regular mb-4" :style="{ opacity: isGameWon ? 1 : 0, color: themeColor, transition: 'opacity 0.5s' }">
            무대 장치 가동: 전력망이 완벽히 복구되었습니다!
        </h2>
        <div v-for="(row, r) in grid">
            <div style="display: inline-block" v-for="(tile, c) in row">
                <div :class="['tile', tile[2] ? 'tile-movable' : 'tile-immovable']" 
                     :style="{ 
                        transform: 'rotate(' + (isCorrectPath(r, c) ? tile[5]*90 : tile[1]*90) + 'deg)',
                        boxShadow: getColour(r, c) ? '0 0 15px ' + themeColor : 'none',
                        border: getColour(r, c) ? '2px solid ' + themeColor : '1px solid #4a4d44'
                     }" @click="rotate(tile, r, c)">
                    
                    <div :style="{ backgroundColor: getColour(r, c) || '#d4af37' }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(r, c) || '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
                    
                    <div :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" 
                         :style="{ backgroundColor: getColour(r, c) || '#d4af37', transform: 'rotate(' + (isCorrectPath(r, c) ? tile[5]*-90 : tile[1]*-90) + 'deg)' }"></div>
                    
                    <div v-if="tile[0] == 'P'" class="portalsymbol active" :style="{ transform: 'rotate(' + (isCorrectPath(r, c) ? tile[5]*-90 : tile[1]*-90) + 'deg)' }">
                        {{tile[4] + 1}}
                    </div>
                </div>
            </div>
            <br />
        </div>
    </div>`
}
