const DURATION_NUMBER_STIM = 1000; // GoNogo刺激の呈示時間
const DURATION_FIXTATION   = 2000; // ITI　+が表示される

const ImgSizeX = 332; // 50% of 664 pixel
const ImgSizeY = 273; // 50% of 645 pixel

// SART task setup
const sartStimuli = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Numbers from 1 to 9
const numTrialsRange = [2, 3]; // min and max trials until probe プローブが出てくるまでの試行数の上限と下限をここで設定 

const numProbes = [5,6]; // don't change
const REPEAT_PROBES = 2;  // それぞれの条件で，プローブを何回いれるか, 

var dt = new Date();
var Y = dt.getFullYear();
var M = ("00" + (dt.getMonth()+1)).slice(-2);
var D = ("00" + (dt.getDate())).slice(-2);
var h = ("00" + (dt.getHours())).slice(-2);
var m = ("00" + (dt.getMinutes())).slice(-2);
var s = ("00" + (dt.getSeconds())).slice(-2);
var T = Y+M+D+'_'+h+m+s;

function saveData(name, data){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'write_data.php'); // 'write_data.php' is the path to the php file described above.
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({filedata: data}));
};
  
jsPsych = initJsPsych({
    override_safe_mode: true,
    on_finish: () => {
        jsPsych.data.displayData();
        //saveData(jsPsych.data.get().csv());
        jsPsych.data.get().localSave('csv', 'SARTwithGraphicalProbe_'+T+'.csv');
        saveData(jsPsych.data.get().csv());
    },
});

// Images to be used in the Probe task
const images6 = [
    'img/01_Focus.png',
    'img/02_TaskRelatedThought.png',
    'img/03_ExternalDistraction.png',
    'img/04_MindWandering.png',
    'img/05_MindBlanking.png',
    'img/06_Forget.png'
];
const images5 = [images6[0],images6[1],images6[2],images6[3],images6[4]];

// Images used in Instruction
const img_file1  = ['img/Inst1_0.PNG','img/Inst1_1.PNG','img/Inst1_2.PNG'];
const img_file51 = ['img/Inst5_1.PNG','img/InstC_2.PNG','img/InstC_3.PNG','img/Inst5_4.PNG','img/Inst5_5.PNG'];
const img_file61 = ['img/Inst6_1.PNG','img/InstC_2.PNG','img/InstC_3.PNG','img/Inst6_4.PNG','img/Inst6_5.PNG'];
const img_file52 = ['img/Inst56_1.PNG'];
const img_file62 = ['img/Inst65_1.PNG'];

var preload = {
    type: jsPsychPreload,
    images: images6,
    auto_preload: true,
    show_detailed_errors: true,
}

const timeline = [];
timeline.push(preload)

function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
};

const createInst = (stim) => {
    const Inst = {
      type: jsPsychImageButtonResponse,
      stimulus: stim,
      choices: ['Next'],
    };
    return Inst;
};
      
function getRandomNumTrials() {
    return Math.floor(Math.random() * (numTrialsRange[1] - numTrialsRange[0] + 1)) + numTrialsRange[0];
}

const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p style="font-size: 100px">+</p>',
    choices: 'NO_KEYS', // どのキー入力も受け付けない
    trial_duration: DURATION_FIXTATION, // 提示時間のための設定項目（単位はミリ秒）
};

// Generate SART trials
function generateSARTTrials() {
    const numTrials = getRandomNumTrials();
    const trials = [];
    for (let i = 0; i < numTrials; i++) {
        trials.push(fixation);
        let stimulus_number = sartStimuli[Math.floor(Math.random() * sartStimuli.length)];
        trials.push({
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `<div style="font-size: 100px;">${stimulus_number}</div>`,
            choices: ' ', // space
            trial_duration: DURATION_NUMBER_STIM, // Stimulus duration 
            response_ends_trial: false,
            //data: { stimulus: stimulus_number, correct_response: (stimulus_number !== 3) },
            on_finish: function (data) {
                data.num_stim = stimulus_number;
                data.RT = data.rt
                if (stimulus_number == 3) {
                    data.condition = 'NoGo'
                    data.correctKey = null;
                } else {
                    data.correctKey = ' ';
                    data.condition = 'Go'
                }
                // 正誤判定・保存
                data.isCorrect = Number(jsPsych.pluginAPI.compareKeys(data.response, data.correctKey));
                jsPsych.finishTrial();
            }
        });
    }
    return trials;
};

// Probe task setup
function generateProbeTrial(tmp_images) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const shuffledImages = shuffle(tmp_images.slice());
            let html = '<div class="image-container"><P style="color: white">';
            for (let i = 0; i < shuffledImages.length; i++) {
                html += `<img src="${shuffledImages[i]}" width="${ImgSizeX}" height="${ImgSizeY}" data-choice="${shuffledImages[i]}" onclick="jsPsych.finishTrial({selected_image: '${shuffledImages[i]}',state: Number('${shuffledImages[i].substr(5,1)}')});">`;
                if (i == 2) {
                    html += '</P><P class="em">この選択肢が出る直前の状態を選択してください</P><P style="color: white">'
                } else if (i<(shuffledImages.length-1)){
                    html += 'xxxxxxxx'
                };                
            }
            html += '</P></div>';
            return html;
        },
        choices: [],  // No buttons, images are clickable
        on_finish: function (data) {
            data.probes = tmp_images.length;
            jsPsych.finishTrial();
        }
    };
};

const sleep_scale = ["まったく眠くない","すこし眠い","かなり眠い","ものすごく眠い"];
const sleepiness = {
    type: jsPsychSurveyLikert,
    questions: [
      { prompt: "今の眠気", name: 'sleepiness', labels: sleep_scale, required: true },
    ],
    button_label: '次へ',
};

// main routine
const Inst1 = img_file1.map((stim) => createInst(stim)) ;
timeline.push(Inst1)

const shuffledNumProbes = shuffle(numProbes.slice());
for (let i = 0; i < shuffledNumProbes.length; i++){

    var tmp_Inst = [];
    if (shuffledNumProbes[i]==5 ) {
        tmp_images = images5;
        if (i==0){ 
            tmp_Inst = img_file51.map((stim) => createInst(stim));
        } else {
            tmp_Inst = img_file62.map((stim) => createInst(stim));
        };
    } else if (shuffledNumProbes[i]==6 ) {
        tmp_images = images6;
        if (i==0){ 
            tmp_Inst = img_file61.map((stim) => createInst(stim));
        } else {
            tmp_Inst = img_file52.map((stim) => createInst(stim));
        };
    } ;
    timeline.push(tmp_Inst)

    for (let j=0; j<REPEAT_PROBES; j++){
        timeline.push(generateSARTTrials());
        timeline.push(fixation);
        timeline.push(generateProbeTrial(tmp_images));
        timeline.push(sleepiness);
    }
}

//// participant code function
const generateParticipantCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const randomDigits = Math.floor(Math.random() * 900) + 100; // Generates a number between 100 and 999
    return `${randomLetters}-${randomDigits}`;
};

//// use the function
const participantCode = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      const code = generateParticipantCode();
      jsPsych.data.addProperties({ participantCode: code });
      return `<p>参加者コード: <strong>${code}</strong></p>`;
    },
    prompt: '<p>ご参加ありがとうございました。必ず上のボタンをクリックして終了してください。</p>',
    choices: ['コードをメモしたらここをクリックして終了して下さい']
};

timeline.push(participantCode);

jsPsych.run(timeline);
