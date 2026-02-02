import { ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const gridwidth = params.has('cols') ? parseInt(params.get('cols')) : 12;
        const gridheight = params.has('rows') ? parseInt(params.get('rows')) : 5;
        
        const start = '0,0';
        let end;
        if(gridwidth >= gridheight) {
            end = Math.floor(Math.random()*gridheight) + ',' + Math.floor(Math.random()*gridwidth/2 + gridwidth/2);
        } else {
            end = Math.floor(Math.random()*gridheight/2 + gridheight/2) + ',' + Math.floor(Math.random()*gridwidth);
        }
        
        const pathlength = Math.floor(Math.random()*(0.2*gridwidth*gridheight) + 0.4*gridwidth*gridheight);
        var path1 = [start], path2 = [end], curpathlength = 2;

        function getNextTile(coord) {
            const [r, c] = coord.split(',').map(Number);
            const tiles = [];
            [[r-1, c], [r+1, c], [r, c-1], [r, c+1]].forEach(([nr, nc]) => {
                const ntile = nr + ',' + nc;
                if (nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth && !path1.includes(ntile) && !path2.includes(ntile)) tiles.push(ntile);
            });
            return tiles.length > 0 ? tiles[Math.floor(Math.random()*tiles.length)] : false;
        }

        function getDir(coord1, coord2) {
            const [r1, c1] = coord1.split(',').map(Number);
            const [r2, c2] = coord2.split(',').map(Number);
            if(r1 === r2) return c1 > c2 ? 'left' : 'right';
            if(c1 === c2) return r1 > r2 ? 'up' : 'down';
            return 'portal';
        }

        let first = true;
        while(curpathlength < pathlength) {
            if(Math.random() < 0.5 || first) {
                const t1 = getNextTile(path1[path1.length-1]);
                if(t1) path1.push(t1);
            }
            if(Math.random() >= 0.5 || first) {
                const t2 = getNextTile(path2[path2.length-1]);
                if(t2) path2.push(t2);
            }
            curpathlength = path1.length + path2.length;
            first = false;
        }

        const fullpath = path1.concat(path2.toReversed());
        const grid = ref([]);
        const dirs = ['down', 'left', 'up', 'right'];
        let portalnum = 0, portals = {};

        for(let i = 0; i < gridheight; i++) {
            let row = [];
            for(let j = 0; j < gridwidth; j++) {
                let type = 'D', rotation = 0, movable = 0, extra = '';
                let coord = i+','+j;
                let pathIdx = fullpath.indexOf(coord);

                if(pathIdx !== -1) {
                    if(start === coord) { type = 'S'; rotation = dirs.indexOf(getDir(coord, fullpath[pathIdx+1])); }
                    else if(end === coord) { type = 'E'; rotation = dirs.indexOf(getDir(coord, fullpath[pathIdx-1])); }
                    else {
                        let prev = getDir(coord, fullpath[pathIdx-1]), next = getDir(coord, fullpath[pathIdx+1]);
                        if(next === 'portal' || prev === 'portal') {
                            type = 'P';
                            if(!portals[coord]) {
                                let other = next === 'portal' ? fullpath[pathIdx+1] : fullpath[pathIdx-1];
                                portals[coord] = portalnum; portals[other] = portalnum; extra = portalnum++;
                            } else extra = portals[coord];
                            rotation = dirs.indexOf(next === 'portal' ? prev : next);
                        } else if(Math.abs(dirs.indexOf(next) - dirs.indexOf(prev)) === 2) {
                            type = 'I'; rotation = dirs.indexOf(next) % 2;
                        } else {
                            type = 'L'; rotation = (Math.max(dirs.indexOf(next), dirs.indexOf(prev)) + 1)%4;
                            if(rotation === 0 && Math.min(dirs.indexOf(next), dirs.indexOf(prev)) === 0) rotation = 1;
                        }
                    }
                    movable = (type === 'P' ? Math.random() < 0.3 : Math.random() < 0.8) ? 1 : 0;
                    if(movable) rotation = (rotation + Math.floor(Math.random()*3)+1)%4;
                } else {
                    type = Math.random() < 0.3 ? 'D' : (Math.random() < 0.5 ? 'I' : 'L');
                    rotation = Math.floor(Math.random()*4);
                    movable = type !== 'D' ? 1 : 0;
                }
                row.push([type, rotation, movable, '', extra]); // index 3: 색상, 4: 포털번호
            }
            grid.value.push(row);
        }

        const colours = {'A': '#FF4500'};
        let shapes = Array.from({length: portalnum}, (_, i) => i + 1);

        // 전류 전파 로직: 타일 연결 상태를 계산하여 불을 켬
        const updatePropagation = () => {
            grid.value.forEach(r => r.forEach(t => t[3] = ''));
            let queue = [start], visited = new Set();
            while(queue.length > 0) {
                let curr = queue.shift();
                if(visited.has(curr)) continue;
                visited.add(curr);
                let [r, c] = curr.split(',').map(Number);
                let tile = grid.value[r][c];
                tile[3] = 'A'; // 연결됨 표시

                // 인접 타일 연결 체크 (I, L, P, S, E 기하학적 체크 로직 생략 - 시각화를 위해 일단 색 전파)
                // 실제 퍼즐 완성 체크를 위해 이 부분에 방향 체크 로직이 들어가야 함
            }
        };

        onMounted(updatePropagation);

        return { 
            grid, shapes, colours,
            getNodeClass: (type, alt=false) => {
                const mapping = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return mapping[type] || "";
            },
            getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
            getColour: (tile) => (tile[0] === 'S' || tile[0] === 'E' || tile[3] !== '') ? colours['A'] : '',
            rotate: (tile, r, c) => { 
                if(tile[2]) {
                    grid.value[r][c][1] = (grid.value[r][c][1] + 1)%4;
                    updatePropagation();
                }
            },
            checkWinStatus: () => {
                const [er, ec] = end.split(',').map(Number);
                return grid.value[er] && grid.value[er][ec][3] !== '';
            }
        };
    },
    template: `
    <div class="d-flex flex-column align-items-center">
        <h2 class="grandiflora-one-regular mb-4" :style="{ visibility: checkWinStatus() ? 'visible' : 'hidden', color: '#FF4500' }">전류가 연결되었습니다!</h2>
        <div v-for="(row, rowIndex) in grid" :key="rowIndex">
            <div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
                <div :class="['tile', getMovableClass(tile[2])]" :style="{ transform: 'rotate('+tile[1]*90+'deg)' }" @click="rotate(tile, rowIndex, colIndex)">
                    <div :style="{ backgroundColor: getColour(tile) }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(tile) }" :class="getNodeClass(tile[0],true)"></div>
                    <div :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" :style="{ backgroundColor: getColour(tile), transform: 'rotate('+tile[1]*-90+'deg)' }"></div>
                    <div v-if="tile[0] == 'P'" class="portalsymbol" :style="{ transform: 'rotate('+tile[1]*-90+'deg)' }">{{ shapes[tile[4]] }}</div>
                </div>
            </div>
            <br />
        </div>
    </div>`
}
