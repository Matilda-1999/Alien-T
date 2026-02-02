import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        
        const showAnswer = params.get('topsecret') === 'true';
        const gridwidth = params.has('cols') ? parseInt(params.get('cols')) : 12;
        const gridheight = params.has('rows') ? parseInt(params.get('rows')) : 5;
        
        const start = '0,0';
        const end = Math.floor(Math.random() * gridheight) + ',' + (gridwidth - 1);
        
        const pathlength = Math.floor(Math.random()*(0.2*gridwidth*gridheight) + 0.4*gridwidth*gridheight);
        var path1 = [start], path2 = [end], curpathlength = 2;
        
        function getNextTile(coord, p1, p2) {
            const [r, c] = coord.split(',').map(Number);
            const tiles = [];
            const checkDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of checkDirs) {
                const nr = r + dr, nc = c + dc;
                const ntile = nr + ',' + nc;
                if (nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth && !p1.includes(ntile) && !p2.includes(ntile)) {
                    tiles.push(ntile);
                }
            }
            return tiles.length > 0 ? tiles[Math.floor(Math.random() * tiles.length)] : false;
        }
        
        // 포털 개수를 무조건 2쌍으로 고정하기 위한 변수
        let portalCreatedCount = 0;
        const maxPortals = 2; 

        let first = true, safety = 0;
        while(curpathlength < pathlength && safety < 1000) {
            safety++;
            if(Math.random() < 0.5 || first) {
                const t1 = getNextTile(path1[path1.length-1], path1, path2);
                if(t1) { path1.push(t1); curpathlength++; }
                else if (portalCreatedCount < maxPortals) { // 포털이 필요하고 아직 2개가 안 넘었을 때만 생성
                    for(let i=0; i<50; i++) {
                        let chk = Math.floor(Math.random()*gridheight)+','+Math.floor(Math.random()*gridwidth);
                        if(!path1.includes(chk) && !path2.includes(chk) && getNextTile(chk, path1, path2)) {
                            path1.push(chk); curpathlength++; portalCreatedCount++; break;
                        }
                    }
                }
            }
            if(Math.random() >= 0.5 || first) {
                const t2 = getNextTile(path2[path2.length-1], path1, path2);
                if(t2) { path2.push(t2); curpathlength++; }
                else if (portalCreatedCount < maxPortals) {
                    for(let i=0; i<50; i++) {
                        let chk = Math.floor(Math.random()*gridheight)+','+Math.floor(Math.random()*gridwidth);
                        if(!path1.includes(chk) && !path2.includes(chk) && getNextTile(chk, path1, path2)) {
                            path2.push(chk); curpathlength++; portalCreatedCount++; break;
                        }
                    }
                }
            }
            first = false;
        }
        
        function getDir(c1, c2) {
            if(!c1 || !c2) return 'down';
            const [r1, cl1] = c1.split(',').map(Number), [r2, cl2] = c2.split(',').map(Number);
            if(r1 === r2) return cl1 > cl2 ? 'left' : 'right';
            if(cl1 === cl2) return r1 > r2 ? 'up' : 'down';
            return 'portal';
        }
        
        const fullpath = path1.concat(path2.toReversed());
        const grid = ref([]), dirs = ['down', 'left', 'up', 'right'];
        let portalnum = 0, portals = {};

        for(let i = 0; i < gridheight; i++) {
            let row = [];
            for(let j = 0; j < gridwidth; j++) {
                let type = 'D', rotation = 0, movable = 0, extra = '';
                let coord = i+','+j, pathIdx = fullpath.indexOf(coord);

                if(pathIdx !== -1) {
                    if(start === coord) { 
                        type = 'S'; rotation = dirs.indexOf(getDir(coord, fullpath[pathIdx+1])); 
                    } else if(end === coord) { 
                        type = 'E'; rotation = dirs.indexOf(getDir(coord, fullpath[pathIdx-1])); 
                    } else {
                        let prevD = getDir(coord, fullpath[pathIdx-1]), nextD = getDir(coord, fullpath[pathIdx+1]);
                        if(nextD === 'portal' || prevD === 'portal') {
                            type = 'P';
                            if(portals[coord] === undefined) {
                                let other = nextD === 'portal' ? fullpath[pathIdx+1] : fullpath[pathIdx-1];
                                portals[coord] = portalnum; portals[other] = portalnum; extra = portalnum++;
                            } else extra = portals[coord];
                            rotation = dirs.indexOf(nextD === 'portal' ? prevD : nextD);
                        } else {
                            let d1 = dirs.indexOf(prevD), d2 = dirs.indexOf(nextD);
                            if(Math.abs(d1 - d2) === 2) { 
                                type = 'I'; rotation = d1 % 2; 
                            } else { 
                                type = 'L';
                                if ((d1 === 0 && d2 === 3) || (d1 === 3 && d2 === 0)) rotation = 0;
                                else if ((d1 === 0 && d2 === 1) || (d1 === 1 && d2 === 0)) rotation = 1;
                                else if ((d1 === 1 && d2 === 2) || (d1 === 2 && d2 === 1)) rotation = 2;
                                else if ((d1 === 2 && d2 === 3) || (d1 === 3 && d2 === 2)) rotation = 3;
                            }
                        }
                    }
                    movable = (type === 'P' ? Math.random() < 0.3 : Math.random() < 0.8) ? 1 : 0;
                    if(movable) rotation = (rotation + Math.floor(Math.random()*3)+1)%4;
                } else {
                    type = Math.random() < 0.3 ? 'D' : (Math.random() < 0.5 ? 'I' : 'L');
                    rotation = Math.floor(Math.random()*4); movable = type !== 'D' ? 1 : 0;
                }
                row.push([type, rotation, movable, '', extra]); 
            }
            grid.value.push(row);
        }
        
        const themeColor = '#FF4500'; 
        let shapes = [1, 2]; // 포털 숫자를 1, 2로 고정

        const checkWinStatus = () => {
            const [er, ec] = end.split(',').map(Number);
            return grid.value[er] && grid.value[er][ec][3] !== '';
        };

        return { 
            grid, shapes, themeColor, checkWinStatus,
            getNodeClass: (t, alt=false) => {
                const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return m[t] || "";
            },
            getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
            getColour: (tile, r, c) => (tile[0] === 'S' || tile[0] === 'E' || (showAnswer && fullpath.includes(r + ',' + c))) ? themeColor : '',
            rotate: (t, r, c) => { if(t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1)%4; },
            isCorrectPath: (r, c) => showAnswer && fullpath.includes(r + ',' + c)
        };
    },
    template: `
    <div class="d-flex flex-column align-items-center">
        <h2 class="grandiflora-one-regular mb-4" :style="{ visibility: checkWinStatus() ? 'visible' : 'hidden', color: themeColor }">
            전류가 연결되었습니다!
        </h2>
        <div v-for="(row, rowIndex) in grid" :key="rowIndex">
            <div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
                <div :class="['tile', getMovableClass(tile[2])]" 
                     :style="{ 
                        transform: isCorrectPath(rowIndex, colIndex) ? 'rotate(0deg)' : 'rotate('+tile[1]*90+'deg)',
                        outline: isCorrectPath(rowIndex, colIndex) ? '3px solid #FF3300' : 'none',
                        boxShadow: isCorrectPath(rowIndex, colIndex) ? '0 0 15px #FF3300' : 'none'
                     }" @click="rotate(tile, rowIndex, colIndex)">
                    <div :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
                    <div :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" 
                         :style="{ 
                            backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37', 
                            transform: isCorrectPath(rowIndex, colIndex) ? 'rotate(0deg)' : 'rotate('+tile[1]*-90+'deg)' 
                         }"></div>
                    <div v-if="tile[0] == 'P'" class="portalsymbol active" 
                         :style="{ transform: isCorrectPath(rowIndex, colIndex) ? 'rotate(0deg)' : 'rotate('+tile[1]*-90+'deg)' }">
                        {{ shapes[tile[4]] }}
                    </div>
                </div>
            </div>
            <br />
        </div>
    </div>`
}
