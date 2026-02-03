//0203-17

import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        const gridwidth = 12; 
        const gridheight = 8; 
        const themeColor = '#FF0000'; 

        // 사용자 정의 인덱스 물리 연결 매핑: 0:┘(1,2), 1:└(3,2), 2:┌(3,0), 3:┐(1,0)
        const getOpenings = (tile) => {
            const rot = tile[1];
            if (tile[0] === 'S' || tile[0] === 'P' || tile[0] === 'E') return [rot];
            if (tile[0] === 'I') return [rot, (rot + 2) % 4];
            if (tile[0] === 'L') {
                const l_map = [[1, 2], [3, 2], [3, 0], [1, 0]]; 
                return l_map[rot] || [];
            }
            return [];
        };

        // [스프레드시트 전수 추출 데이터]
        const patternA = [[0, 0, "S", 3], [0, 1, "L", 3], [0, 3, "L", 2], [0, 4, "L", 3], [0, 5, "P", 3, 1], [0, 6, "I", 1], [0, 7, "I", 1], [0, 8, "L", 3], [1, 1, "I", 0], [1, 3, "I", 0], [1, 4, "L", 1], [1, 5, "L", 3], [1, 6, "L", 2], [1, 7, "L", 3], [1, 8, "L", 1], [1, 9, "I", 1], [1, 10, "L", 3], [2, 1, "L", 1], [2, 2, "I", 1], [2, 3, "L", 0], [2, 4, "P", 3, 0], [2, 5, "L", 0], [2, 6, "I", 0], [2, 7, "L", 1], [2, 8, "I", 1], [2, 9, "I", 1], [2, 10, "L", 0], [3, 6, "L", 1], [3, 7, "P", 1, 2], [3, 8, "L", 2], [3, 9, "L", 3], [3, 10, "L", 2], [3, 11, "E", 1], [4, 2, "P", 3, 2], [4, 3, "L", 3], [4, 5, "L", 2], [4, 6, "I", 1], [4, 7, "I", 1], [4, 8, "L", 0], [4, 9, "I", 0], [4, 10, "I", 0], [5, 3, "L", 1], [5, 4, "I", 1], [5, 5, "L", 0], [5, 8, "P", 0, 1], [5, 9, "I", 0], [5, 10, "I", 0], [6, 3, "L", 2], [6, 4, "P", 1, 0], [6, 8, "I", 0], [6, 9, "L", 1], [6, 10, "L", 0], [7, 3, "L", 1], [7, 4, "I", 1], [7, 5, "I", 1], [7, 6, "I", 1], [7, 7, "I", 1], [7, 8, "L", 0]];
        const patternB = [[0, 0, "S", 3], [0, 1, "L", 3], [0, 5, "P", 3, 0], [0, 6, "L", 3], [1, 1, "I", 0], [1, 2, "L", 2], [1, 3, "I", 1], [1, 4, "I", 1], [1, 5, "I", 1], [1, 6, "L", 0], [2, 1, "L", 1], [2, 2, "L", 0], [2, 3, "P", 0, 1], [3, 3, "I", 0], [3, 5, "L", 2], [3, 6, "I", 1], [3, 7, "L", 3], [3, 8, "L", 2], [3, 9, "I", 1], [3, 10, "L", 3], [4, 3, "L", 1], [4, 4, "L", 3], [4, 5, "P", 2, 2], [4, 7, "I", 0], [4, 8, "I", 0], [4, 9, "P", 0, 2], [4, 10, "I", 0], [5, 3, "L", 2], [5, 4, "L", 0], [5, 6, "L", 2], [5, 7, "L", 0], [5, 8, "I", 0], [5, 9, "I", 0], [5, 10, "I", 0], [5, 11, "E", 2], [6, 3, "I", 0], [6, 5, "L", 2], [6, 6, "L", 0], [6, 7, "P", 0, 1], [6, 8, "L", 1], [6, 9, "L", 0], [6, 10, "I", 0], [6, 11, "I", 0], [7, 0, "P", 3, 0], [7, 1, "I", 1], [7, 2, "I", 1], [7, 3, "L", 0], [7, 5, "L", 1], [7, 6, "I", 1], [7, 7, "L", 0], [7, 10, "L", 1], [7, 11, "L", 0]];
        
        // 패턴 선택 로직
        const isPatternASelected = Math.random() < 0.5;
        const selectedPattern = isPatternASelected ? patternA : patternB;
        const patternType = isPatternASelected ? 'A' : 'B'; // 패턴 타입을 저장
        
        const grid = ref([]);
        const poweredTiles = ref(new Set()); 

        for (let i = 0; i < gridheight; i++) {
            let row = [];
            for (let j = 0; j < gridwidth; j++) {
                let coord = `${i},${j}`;
                let p = selectedPattern.find(x => `${x[0]},${x[1]}` === coord);
                let type, rotation, movable, extra, ansRot;

                if (p) {
                    type = p[2]; ansRot = p[3]; 
                    extra = p[4] !== undefined ? p[4] : '';
                    movable = (type === 'S' || type === 'E' || type === 'P') ? 0 : 1;
                    // topsecret 접속 시 정답 상태로 시작, 아니면 섞음
                    rotation = showAnswer ? ansRot : (movable === 0 ? ansRot : (ansRot + Math.floor(Math.random() * 3) + 1) % 4);
                } else {
                    const rand = Math.random();
                    if (rand < 0.2) { type = 'D'; movable = 0; } 
                    else { type = rand < 0.6 ? 'I' : 'L'; movable = 1; }
                    ansRot = Math.floor(Math.random() * 4);
                    rotation = ansRot; extra = '';
                }
                row.push([type, rotation, movable, '', extra, ansRot]);
            }
            grid.value.push(row);
        }

        const updatePower = () => {
            const active = new Set();
            const s = selectedPattern.find(p => p[2] === 'S');
            const e = selectedPattern.find(p => p[2] === 'E');
            const queue = [`${s[0]},${s[1]}`, `${e[0]},${e[1]}`]; 
            
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
                const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return m[t] || "";
            },
            getColour: (r, c) => poweredTiles.value.has(`${r},${c}`) ? themeColor : '',
            rotate: (t, r, c) => { if (t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1) % 4; }
        };
    },
    template: `
    <div class="d-flex flex-column align-items-center">
        <h2 :style="{ opacity: isGameWon ? 1 : 0, color: themeColor, transition: 'opacity 0.5s' }">조명 장치가 작동합니다!</h2>
        
        <div v-if="isGameWon" class="victory-image-container">
            <p class="victory-text">
                조명 장치 뒤에서 펄럭이는 종이 하나를 발견했다. <br>
                작동하면 기계가 작동을 감지해 곡선을 그리는 형태다. <br>
                작동한 시간을 대강 유추해 볼 수 있을 듯하다.
            </p>
            <img :src="patternType === 'A' ? './light_line1.png' : './light_line2.png'" class="victory-image">
    </div>

        <div v-for="(row, r) in grid" :key="'r-'+r">
            <div style="display: inline-block" v-for="(tile, c) in row" :key="'c-'+r+'-'+c">
                <div :class="['tile', tile[2] === 0 ? 'tile-immovable' : 'tile-movable']" 
                     :style="{ 
                        transform: 'rotate(' + tile[1] * 90 + 'deg)', 
                        boxShadow: getColour(r, c) ? '0 0 15px '+themeColor : 'none', 
                        border: getColour(r, c) ? '2px solid '+themeColor : '1px solid #4a4d44' 
                     }" @click="rotate(tile, r, c)">
                    <div :style="{ backgroundColor: getColour(r, c) || '#d4af37' }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(r, c) || '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
                    <div v-if="tile[0] !== 'I'" class="circle-node" :style="{ backgroundColor: getColour(r, c) || '#d4af37', transform: 'rotate(' + tile[1] * -90 + 'deg)' }"></div>
                    <div v-if="tile[0] == 'P'" class="portalsymbol active" :style="{ transform: 'rotate(' + tile[1] * -90 + 'deg)' }">{{tile[4] + 1}}</div>
                </div>
            </div>
        </div>
    </div>`
};









