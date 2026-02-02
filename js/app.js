import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        
        // 1. 설정: 행 8줄 고정, 열은 파라미터 따름 (기본 12)
        const gridwidth = params.has('cols') ? parseInt(params.get('cols')) : 12;
        const gridheight = 8; 

        // 2. 정답 경로 정의 (예시: 패턴 A)
        // [행, 열, 타입, 정답회전, 포털번호(있을경우)]
        const patternA = [
            [0,0,'S',3], [0,1,'I',1], [0,2,'P',1,0], // 시작 -> 포털1
            [2,4,'P',3,0], [2,5,'L',0], [3,5,'I',0], [4,5,'P',0,1], // 포털1 -> 포털2
            [1,1,'P',2,1], [1,2,'L',1], [1,3,'I',1], [1,4,'P',1,2], // 포털2 -> 포털3
            [7,10,'P',3,2], [7,11,'E',1] // 포털3 -> 종료
        ];

        // 3. 정답 경로 정의 (예시: 패턴 B)
        const patternB = [
            [0,0,'S',3], [1,0,'L',0], [1,1,'P',3,0], // 시작 -> 포털1
            [5,2,'P',1,0], [5,1,'I',1], [5,0,'L',3], [6,0,'P',2,1], // 포털1 -> 포털2
            [2,8,'P',0,1], [1,8,'L',2], [1,9,'I',1], [1,10,'P',1,2], // 포털2 -> 포털3
            [7,5,'P',2,2], [7,6,'I',1], [7,11,'E',1] // 포털3 -> 종료
        ];

        const selectedPath = Math.random() < 0.5 ? patternA : patternB;
        const fullpathCoords = selectedPath.map(p => p[0] + ',' + p[1]);

        const grid = ref([]);
        const themeColor = '#FF4500';
        const shapes = [1, 2, 3]; // 포털 3쌍 고정

        // 4. 그리드 생성
        for (let i = 0; i < gridheight; i++) {
            let row = [];
            for (let j = 0; j < gridwidth; j++) {
                let coord = i + ',' + j;
                let pathNode = selectedPath.find(p => (p[0] + ',' + p[1]) === coord);
                
                let type, rotation, movable, extra, ansRot;

                if (pathNode) {
                    // 정답 경로 타일
                    type = pathNode[2];
                    ansRot = pathNode[3];
                    extra = pathNode[4] !== undefined ? pathNode[4] : '';
                    movable = (type === 'P' ? 0 : 1);
                    // 초기 위치는 랜덤하게 섞음
                    rotation = movable ? (ansRot + Math.floor(Math.random() * 3) + 1) % 4 : ansRot;
                } else {
                    // 배경 타일 (장식용)
                    let r = Math.random();
                    type = r < 0.3 ? 'D' : (r < 0.6 ? 'I' : 'L');
                    ansRot = Math.floor(Math.random() * 4);
                    rotation = ansRot;
                    movable = (type !== 'D' ? 1 : 0);
                    extra = '';
                }
                row.push([type, rotation, movable, '', extra, ansRot]);
            }
            grid.value.push(row);
        }

        return {
            grid, shapes, themeColor,
            getNodeClass: (t, alt = false) => {
                const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return m[t] || "";
            },
            getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
            getColour: (tile, r, c) => (tile[0] === 'S' || tile[0] === 'E' || (showAnswer && fullpathCoords.includes(r + ',' + c))) ? themeColor : '',
            rotate: (t, r, c) => { if (t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1) % 4; },
            isCorrectPath: (r, c) => showAnswer && fullpathCoords.includes(r + ',' + c),
            checkWinStatus: () => false // 검증 로직 별도
        };
    },
    template: `
    <div class="d-flex flex-column align-items-center">
        <div v-for="(row, rowIndex) in grid" :key="rowIndex">
            <div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
                <div :class="['tile', getMovableClass(tile[2])]" 
                     :style="{ 
                        transform: isCorrectPath(rowIndex, colIndex) ? 'rotate('+tile[5]*90+'deg)' : 'rotate('+tile[1]*90+'deg)',
                        outline: isCorrectPath(rowIndex, colIndex) ? '3px solid #FF3300' : 'none',
                        boxShadow: isCorrectPath(rowIndex, colIndex) ? '0 0 15px #FF3300' : 'none'
                     }" @click="rotate(tile, rowIndex, colIndex)">
                    <div :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
                    <div :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" 
                         :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37', transform: isCorrectPath(rowIndex, colIndex) ? 'rotate('+tile[5]*-90+'deg)' : 'rotate('+tile[1]*-90+'deg)' }"></div>
                    <div v-if="tile[0] == 'P'" class="portalsymbol active" :style="{ transform: isCorrectPath(rowIndex, colIndex) ? 'rotate('+tile[5]*-90+'deg)' : 'rotate('+tile[1]*-90+'deg)' }">
                        {{shapes[tile[4]]}}
                    </div>
                </div>
            </div>
            <br />
        </div>
    </div>`
}
