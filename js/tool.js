// 初始化24个输入框
function initInputGrid() {
    const grid = document.getElementById('dataInputGrid');
    let html = '';
    for (let i = 0; i < 24; i++) {
        html += `
            <div class="input-item">
                <label>${i.toString().padStart(2, '0')}:00</label>
                <input type="number" id="hour${i}" step="0.1" min="0" max="30" placeholder="0.0">
            </div>
        `;
    }
    grid.innerHTML = html;
}

// 载入示例数据
function loadSampleData() {
    for (let i = 0; i < 24; i++) {
        document.getElementById(`hour${i}`).value = SAMPLE_DATA[i];
    }
}

// 清空数据
function clearData() {
    for (let i = 0; i < 24; i++) {
        document.getElementById(`hour${i}`).value = '';
    }
    document.getElementById('resultSection').style.display = 'none';
}

// 计算指标
function calculateMetrics() {
    const data = [];
    for (let i = 0; i < 24; i++) {
        const val = parseFloat(document.getElementById(`hour${i}`).value);
        if (isNaN(val) || val < 0 || val > 30) {
            alert(`第${i}时的数据无效，请输入0-30之间的数值`);
            return;
        }
        data.push(val);
    }

    // 计算TIR（3.9-10.0范围内的时间占比）
    const inRange = data.filter(v => v >= 3.9 && v <= 10.0).length;
    const tir = (inRange / data.length * 100).toFixed(1);

    // 计算GMI（估算糖化血红蛋白）
    // GMI = 3.31 + 0.02392 × 平均血糖（mg/dL）
    // 先将mmol/L转换为mg/dL：1 mmol/L = 18 mg/dL
    const avgMmol = data.reduce((a, b) => a + b, 0) / data.length;
    const avgMg = avgMmol * 18;
    const gmi = (3.31 + 0.02392 * avgMg).toFixed(2);

    // 计算CV（变异系数）
    const std = Math.sqrt(data.reduce((sum, v) => sum + Math.pow(v - avgMmol, 2), 0) / data.length);
    const cv = (std / avgMmol * 100).toFixed(1);

    // 显示结果
    document.getElementById('tirValue').textContent = tir + '%';
    document.getElementById('gmiValue').textContent = gmi + '%';
    document.getElementById('cvValue').textContent = cv + '%';

    // 状态判断
    document.getElementById('tirStatus').textContent = tir >= 70 ? '✓ 达标' : '✗ 未达标';
    document.getElementById('tirStatus').className = 'metric-status ' + (tir >= 70 ? 'good' : 'bad');
    
    document.getElementById('gmiStatus').textContent = gmi < 7 ? '✓ 达标' : '✗ 未达标';
    document.getElementById('gmiStatus').className = 'metric-status ' + (gmi < 7 ? 'good' : 'bad');
    
    document.getElementById('cvStatus').textContent = cv < 36 ? '✓ 达标' : '✗ 未达标';
    document.getElementById('cvStatus').className = 'metric-status ' + (cv < 36 ? 'good' : 'bad');

    // 绘制图表
    drawChart(data);

    // 生成解读
    generateInterpretation(tir, gmi, cv, avgMmol);

    // 显示结果区
    document.getElementById('resultSection').style.display = 'block';
}

// 绘制血糖曲线图
function drawChart(data) {
    const chart = echarts.init(document.getElementById('agpChart'));
    const hours = data.map((_, i) => `${i}:00`);
    
    const option = {
        title: { text: '24小时血糖曲线', left: 'center' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['你的血糖', '目标范围', '低血糖线', '高血糖线'], bottom: 0 },
        xAxis: { type: 'category', data: hours },
        yAxis: { 
            type: 'value', 
            name: '血糖(mmol/L)',
            min: 0,
            max: 15
        },
        series: [
            {
                name: '你的血糖',
                type: 'line',
                data: data,
                smooth: true,
                lineStyle: { color: '#2563EB', width: 3 },
                itemStyle: { color: '#2563EB' }
            },
            {
                name: '低血糖线',
                type: 'line',
                data: hours.map(() => 3.9),
                lineStyle: { color: '#EF4444', type: 'dashed', width: 2 },
                symbol: 'none'
            },
            {
                name: '高血糖线',
                type: 'line',
                data: hours.map(() => 10.0),
                lineStyle: { color: '#F59E0B', type: 'dashed', width: 2 },
                symbol: 'none'
            }
        ],
        color: ['#2563EB', '#10B981', '#EF4444', '#F59E0B']
    };
    chart.setOption(option);
}

// 生成解读文本
function generateInterpretation(tir, gmi, cv, avg) {
    let text = '<ul>';
    text += `<li><strong>TIR = ${tir}%</strong>：${tir >= 70 ? '达标，血糖控制在目标范围内的时间充足' : '未达标，需提高在3.9-10.0范围内的占比'}</li>`;
    text += `<li><strong>GMI = ${gmi}%</strong>：${gmi < 7 ? '达标，预估糖化血红蛋白良好' : '未达标，长期血糖控制需改善'}</li>`;
    text += `<li><strong>CV = ${cv}%</strong>：${cv < 36 ? '达标，血糖波动较小' : '偏高，血糖波动较大需关注'}</li>`;
    text += `<li><strong>平均血糖 = ${avg.toFixed(2)} mmol/L</strong></li>`;
    text += '</ul>';
    text += '<p>建议：保持规律饮食、适量运动、定期监测。如有异常请咨询专业医师。</p>';
    document.getElementById('interpretationText').innerHTML = text;
}

// 页面加载时初始化
window.onload = initInputGrid;