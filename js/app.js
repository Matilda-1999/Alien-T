import { ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        // 1. 변수 초기화 및 파라미터 설정
        const paths = { 'A': [] }; 
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        
        const showAnswer = params.get('topsecret') === 'true';
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
        
        var path1 = [start];
        var path2 = [end];
        var curpathlength = 2;
        
        // 2. 경로 생성 알고리즘
        function getNextTile(coord) {
            const coords = coord.split(',');
            const row = parseInt(coords[0]);
            const col = parseInt(coords[1]);
            var tiles = [];
            
            const dirs = [[-1, 0], [0, -1], [0, 1], [1, 0]];
            for (let [dr, dc] of dirs) {
                const nr = row + dr;
                const nc = col + dc;
                const ntile = nr + ',' + nc;
                if (nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth && !path1.includes(ntile) && !path2.includes(ntile)) {
                    tiles.push(ntile);
                }
            }
            return tiles.length > 0 ? tiles[Math.floor(Math.random()*tiles.length)] : false;
        }
        
        var first = true;
        let portalscheck = [];
        while(curpathlength < pathlength) {
            if(Math.random() < 0.5 || first) {
                const tile1 = getNextTile(path1[path1.length-1]);
                if(tile1) path1.push(tile1);
                curpathlength++;
            }
            if(Math.random() >= 0.5 || first) {
                const tile2 = getNextTile(path2[path2.length-1]);
                if(tile2) path2.push(tile2);
                curpathlength++;
            }
            first = false;
        }
        
        function getDir(coord1, coord2) {
            if(!coord1 || !coord2) return 'down';
            let c1 = coord1.split(',').map(Number);
            let c2 = coord2.split(',').map(Number);
            if(c1[0] == c2[0]) return c1[1] > c2[1] ? 'left' : 'right';
            if(c1[1] == c2[1]) return c1[0] > c2[0] ? 'up' : 'down';
            return 'portal';
        }
        
        const fullpath = path1.concat(path2.toReversed());
        paths['A'] = fullpath; // paths 변수에 생성된 경로 할당

        // 3. 그리드 데이터 구성
        var grid = ref([]);
        const dirs = ['down', 'left', 'up', 'right'];
        let portalnum = 0;
        let portals = {};
        
        for(let i = 0; i < gridheight; i++) {
            let row = [];
            for(let j = 0; j < gridwidth; j++) {
                let type = 'D', rotation = 0, movable = 0, extra = '', p_idx = -1;
                let coord = i+','+j;
                let pathIndex = fullpath.indexOf(coord);
                
                if(pathIndex !== -1) {
                    if(coord === start) {
                        type = 'S';
                        rotation = dirs.indexOf(getDir(coord, fullpath[pathIndex+1]));
                    } else if(coord === end) {
                        type = 'E';
                        rotation = dirs.indexOf(getDir(coord, fullpath[pathIndex-1]));
                    } else {
                        let prev = getDir(coord, fullpath[pathIndex-1]);
                        let next = getDir(coord, fullpath[pathIndex+1]);
                        if(next === 'portal' || prev === 'portal') {
                            type = 'P';
                            if(portals[coord] === undefined) {
                                let other = next === 'portal' ? fullpath[pathIndex+1] : fullpath[pathIndex-1];
                                portals[coord] = portalnum;
                                portals[other] = portalnum;
                                p_idx = portalnum++;
                            } else p_idx = portals[coord];
                            rotation = dirs.indexOf(next === 'portal' ? prev : next);
                        } else if(Math.abs(dirs.indexOf(next) - dirs.indexOf(prev)) % 2 === 0) {
                            type = 'I';
                            rotation = dirs.indexOf(next) % 2;
                        } else {
                            type = 'L';
                            let d1 = dirs.indexOf(prev), d2 = dirs.indexOf(next);
                            rotation = (Math.abs(d1-d2) === 3) ? 0 : Math.max(d1, d2);
                        }
                    }
                    movable = (type === 'P' ? Math.random() < 0.3 : Math.random() < 0.8) ? 1 : 0;
                    if(movable) rotation = (rotation + Math.floor(Math.random()*3)+1)%4;
                } else {
                    type = Math.random() < 0.3 ? 'D' : (Math.random() < 0.5 ? 'I' : 'L');
                    rotation = Math.floor(Math.random()*4);
                    movable = type !== 'D' ? 1 : 0;
                }
                row.push([type, rotation, movable, '', p_idx]); // index 3은 전파 색상, 4는 포털 번호
            }
            grid.value.push(row);
        }

        // 4. 전파(Propagation) 알고리즘
        const updatePropagation = () => {
            grid.value.forEach(r => r.forEach(tile => tile[3] = ''));
            let queue = [start];
            let visited = new Set();
            let activePortals = new Set();

            while(queue.length > 0) {
                let curr = queue.shift();
                if(visited.has(curr)) continue;
                visited.add(curr);
                
                let [r, c] = curr.split(',').map(Number);
                let tile = grid.value[r][c];
                tile[3] = colours['A'];

                let currentConnects = [];
                let rot = tile[1];
                if(tile[0] === 'S' || tile[0] === 'E') currentConnects.push(dirs[rot]);
                else if(tile[0] === 'I') currentConnects.push(dirs[rot], dirs[(rot+2)%4]);
                else if(tile[0] === 'L') currentConnects.push(dirs[rot], dirs[(rot+3)%4]);
                else if(tile[0] === 'P') {
                    currentConnects.push(dirs[rot]);
                    let pNum = tile[4];
                    if(!activePortals.has(pNum)) {
                        activePortals.add(pNum);
                        for(let i=0; i<gridheight; i++) {
                            for(let j=0; j<gridwidth; j++) {
                                if(grid.value[i][j][0] === 'P' && grid.value[i][j][4] === pNum && (i+','+j) !== curr) {
                                    queue.push(i+','+j);
                                }
                            }
                        }
                    }
                }

                for(let side of currentConnects) {
                    let nr = r, nc = c;
                    if(side === 'up') nr--; else if(side === 'down') nr++; else if(side === 'left') nc--; else if(side === 'right') nc++;
                    if(nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth) {
                        let nextTile = grid.value[nr][nc];
                        let nextRot = nextTile[1];
                        let needSide = (side === 'up'?'down':(side==='down'?'up':(side==='left'?'right':'left')));
                        let nextConnects = [];
                        if(nextTile[0] === 'S' || nextTile[0] === 'E') nextConnects.push(dirs[nextRot]);
                        else if(nextTile[0] === 'I') nextConnects.push(dirs[nextRot], dirs[(nextRot+2)%4]);
                        else if(nextTile[0] === 'L') nextConnects.push(dirs[nextRot], dirs[(nextRot+3)%4]);
                        else if(nextTile[0] === 'P') nextConnects.push(dirs[nextRot]);
                        
                        if(nextConnects.includes(needSide)) queue.push(nr+','+nc);
                    }
                }
            }
        };

        const colouroptions = ['#FF8C00', '#FF4500', '#FFA500'];
        const colours = {'A': colouroptions[Math.floor(Math.random()*colouroptions.length)]};
        let shapes = Array.from({length: portalnum}, (_, i) => i + 1);

        onMounted(updatePropagation);

        return { 
            grid, 
            getNodeClass: (type, alt=false) => {
                const mapping = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return mapping[type] || "";
            }, 
            getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable", 
            shapes, 
            rotate: (tile, r, c) => { 
                if(tile[2]) {
                    grid.value[r][c][1] = (grid.value[r][c][1] + 1)%4;
                    updatePropagation();
                }
            }, 
            checkWinStatus: () => {
                let [er, ec] = end.split(',').map(Number);
                return grid.value[er][ec][3] !== '';
            },
            isCorrectPath: (r, c) => showAnswer && fullpath.includes(r + ',' + c)
        };
    },
    template: `
    <div>
        <h2 class="grandiflora-one-regular text-center mb-3" :style="'visibility: ' + (checkWinStatus() ? 'visible' : 'hidden') + '; color: #FF4500; text-shadow: 0 0 10px rgba(255,69,0,0.5);'">
            전류가 연결되었습니다. 무대 장치가 작동합니다!
        </h2>
        <div class="text-center" v-for="(row, rowIndex) in grid" :key="rowIndex">
            <div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
                <div :class="['tile', getMovableClass(tile[2])]" 
                     :style="{ 
                        transform: 'rotate(' + tile[1]*90 + 'deg)',
                        outline: isCorrectPath(rowIndex, colIndex) ? '3px solid #FF3300' : 'none',
                        boxShadow: isCorrectPath(rowIndex, colIndex) ? '0 0 15px #FF3300' : 'none'
                     }" 
                     @click="rotate(tile, rowIndex, colIndex)">
                    <div :style="{ backgroundColor: tile[3] !== '' ? tile[3] : '#d4af37' }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: tile[3] !== '' ? tile[3] : '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
                    <div v-if="tile[0] != 'X'" :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" :style="{ backgroundColor: tile[3] !== '' ? tile[3] : '#d4af37', transform: 'rotate(' + tile[1]*(-90) + 'deg)' }"></div>
                    <div v-if="tile[0] == 'P'" :class="['portalsymbol', 'grandiflora-one-regular', { active: tile[3] !== '' }]" :style="{ transform: 'rotate(' + tile[1]*(-90) + 'deg)' }">{{ shapes[tile[4]] }}</div>
                </div>
            </div>
        </div>
    </div>`
}
