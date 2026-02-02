import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        // 1. 변수 초기화 및 파라미터 설정
        const paths = { 'A': [] }; 
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        
        // 'topsecret' 파라미터가 true일 때 정답 경로 표시 기능을 활성화합니다.
        const showAnswer = params.get('topsecret') === 'true';
        
        const gridwidth = params.has('cols') ? parseInt(params.get('cols')) : 12;
        const gridheight = params.has('rows') ? parseInt(params.get('rows')) : 5;
        
        const start = '0,0'; // 시작점 고정
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
            
            const uptile = (row-1)+','+col;
            if(row > 0 && !path1.includes(uptile) && !path2.includes(uptile)) tiles.push(uptile);
            
            const lefttile = row+','+(col-1);
            if(col > 0 && !path1.includes(lefttile) && !path2.includes(lefttile)) tiles.push(lefttile);
            
            const righttile = row+','+(col+1);
            if(col < gridwidth - 1 && !path1.includes(righttile) && !path2.includes(righttile)) tiles.push(righttile);
            
            const downtile = (row+1)+','+col;
            if(row < gridheight - 1 && !path1.includes(downtile) && !path2.includes(downtile)) tiles.push(downtile);
            
            return tiles.length > 0 ? tiles[Math.floor(Math.random()*tiles.length)] : false;
        }
        
        var first = true;
        let portalscheck = [];
        while(curpathlength < pathlength) {
            let checkcoord = '';
            if(Math.random() < 0.5 || first) {
                const lastTile1 = path1[path1.length-1];
                const tile1 = getNextTile(lastTile1);
                if(tile1 !== false) {
                    path1.push(tile1);
                } else {
                    while(true) {
                        checkcoord = Math.floor(Math.random()*gridheight)+','+Math.floor(Math.random()*gridwidth);
                        if(!path1.includes(checkcoord) && !path2.includes(checkcoord) && getNextTile(checkcoord) !== false) {
                            if(!portalscheck.includes(path1[path1.length-1])) portalscheck.push(path1[path1.length-1]);
                            path1.push(checkcoord);
                            portalscheck.push(checkcoord);
                            break;
                        }
                    }
                }
                curpathlength += 1;
            }
            if(Math.random() >= 0.5 || first) {
                const lastTile2 = path2[path2.length-1];
                const tile2 = getNextTile(lastTile2);
                if(tile2 !== false) {
                    path2.push(tile2);
                } else {
                    while(true) {
                        let checkcoord2 = Math.floor(Math.random()*gridheight)+','+Math.floor(Math.random()*gridwidth);
                        let nextTile = getNextTile(checkcoord2);
                        if(!path1.includes(checkcoord2) && !path2.includes(checkcoord2) && nextTile !== false && nextTile !== checkcoord) {
                            if(!portalscheck.includes(path2[path2.length-1])) portalscheck.push(path2[path2.length-1]);
                            path2.push(checkcoord2);
                            portalscheck.push(checkcoord2);
                            break;
                        }
                    }
                }
                curpathlength += 1;
            }
            if(first) first = false;
        }
        
        function getDir(coord1, coord2) {
            let coords1 = coord1.split(',');
            let coords2 = coord2.split(',');
            if(coords1[0] == coords2[0]) {
                if(parseInt(coords1[1]) == parseInt(coords2[1])+1) return 'left';
                else if(parseInt(coords1[1]) == parseInt(coords2[1])-1) return 'right';
            } else if(coords1[1] == coords2[1]) {
                if(parseInt(coords1[0]) == parseInt(coords2[0])+1) return 'up';
                else if(parseInt(coords1[0]) == parseInt(coords2[0])-1) return 'down';
            }
            return 'portal';
        }
        
        const fullpath = path1.concat(path2.toReversed());
        
        // 3. 그리드 데이터 구성
        var grid = ref([]);
        const dirs = ['down', 'left', 'up', 'right'];
        let portalnum = 0;
        let portals = {};
        for(let i = 0; i < gridheight; i++) {
            let row = [];
            for(let j = 0; j < gridwidth; j++) {
                let type = '', movable = 0, rotation = 0, extra = '';
                let coord = i+','+j;
                let pathIndex = fullpath.indexOf(coord);
                if(pathIndex !== -1) {
                    if(start == coord) {
                        type = 'S';
                        rotation = dirs.indexOf(getDir(coord, fullpath[pathIndex+1]));
                        extra = 'A';
                    } else if(end == coord) {
                        type = 'E';
                        rotation = dirs.indexOf(getDir(coord, fullpath[pathIndex-1]));
                        extra = 'A';
                    } else {
                        let prevDir = getDir(coord, fullpath[pathIndex-1]);
                        let nextDir = getDir(coord, fullpath[pathIndex+1]);
                        if(nextDir == 'portal' || prevDir == 'portal') {
                            type = 'P';
                            if(!portals[coord]) {
                                let other = nextDir == 'portal' ? fullpath[pathIndex+1] : fullpath[pathIndex-1];
                                portals[coord] = portalnum;
                                portals[other] = portalnum;
                                extra = portalnum++;
                            } else extra = portals[coord];
                            rotation = dirs.indexOf(nextDir == 'portal' ? prevDir : nextDir);
                        } else if(Math.abs(dirs.indexOf(nextDir) - dirs.indexOf(prevDir)) == 2) {
                            type = 'I';
                            rotation = dirs.indexOf(nextDir) % 2 == 0 ? 0 : 1;
                        } else {
                            type = 'L';
                            rotation = (Math.max(dirs.indexOf(nextDir), dirs.indexOf(prevDir)) + 1)%4;
                            if(rotation == 0 && Math.min(dirs.indexOf(nextDir), dirs.indexOf(prevDir)) == 0) rotation = 1;
                        }
                    }
                    movable = (['P'].includes(type) ? Math.random() < 0.25 : Math.random() < 0.8) ? 1 : 0;
                    if(movable) rotation = (rotation + Math.floor(Math.random()*3)+1)%4;
                } else {
                    let r = Math.random();
                    type = r < 0.3 ? 'D' : (r < 0.65 ? 'I' : 'L');
                    rotation = Math.floor(Math.random()*4);
                    movable = (Math.random() < 0.7 && type !== 'D') ? 1 : 0;
                }
                row.push([type, rotation, movable, extra, '']);
            }
            grid.value.push(row);
        }

        // 4. 색상 및 헬퍼 함수
        const colouroptions = ['#FF8C00', '#FF4500', '#FFA500']; // 주황색 테마
        const colours = {'A': colouroptions[Math.floor(Math.random()*colouroptions.length)]};
        let shapes = Array.from({length: portalnum}, (_, i) => i + 1);

        function getNodeClass(type, alt=false) {
            const mapping = { "X": "empty-node", "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
            return mapping[type] || "";
        }

        function getColour(tile, rowIndex, colIndex) {
            if(tile[0] === 'S') return colours['A'];
            // (기존 전파 로직 수행하여 연결 시 주황색 반환)
            return tile[3] !== '' ? colours['A'] : '';
        }

        return { 
            grid, getNodeClass, getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable", 
            shapes, getColour, rotate: (tile, r, c) => { if(tile[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1)%4; }, 
            checkWinStatus: () => {
                for(let i=0; i<grid.value.length; i++)
                    for(let j=0; j<grid.value[i].length; j++)
                        if(grid.value[i][j][0] == 'E' && grid.value[i][j][3] === '') return false;
                return true;
            },
            isCorrectPath: (r, c) => showAnswer && fullpath.includes(r + ',' + c)
        };
    },
    template: `
    <div>
        <h2 class="grandiflora-one-regular" :style="'visibility: ' + (checkWinStatus() ? 'visible' : 'hidden') + '; color: #FF4500; text-shadow: 0 0 10px rgba(255,69,0,0.5);'">
            전류가 연결되었습니다. 무대 장치가 작동합니다!
        </h2>
        <div v-for="(row, rowIndex) in grid" :key="rowIndex">
            <div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
                <div :class="['tile', getMovableClass(tile[2])]" 
                     :style="{ 
                        rotate: tile[1]*90+'deg',
                        outline: isCorrectPath(rowIndex, colIndex) ? '3px solid #FF3300' : 'none',
                        boxShadow: isCorrectPath(rowIndex, colIndex) ? '0 0 15px #FF3300' : 'none'
                     }" 
                     @click="rotate(tile, rowIndex, colIndex)">
                    <div :style="{ backgroundColor: (tile[0] === 'S' || tile[0] === 'E' || tile[3] !== '') ? '#FF4500' : '#d4af37' }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: tile[3] !== '' ? '#FF4500' : '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
                    <div v-if="tile[0] != 'X'" :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" :style="{ backgroundColor: (tile[0] === 'S' || tile[0] === 'E' || tile[3] !== '') ? '#FF4500' : '#d4af37', rotate: tile[1]*(-90)+'deg' }"></div>
                    <div v-if="tile[0] == 'P'" :class="['portalsymbol', 'grandiflora-one-regular', { active: tile[3] !== '' }]" :style="{ rotate: tile[1]*(-90)+'deg' }">{{ shapes[tile[4]] }}</div>
                </div>
            </div>
            <br />
        </div>
    </div>`
}
