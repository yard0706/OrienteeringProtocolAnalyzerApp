<template>
  <q-page :style-fn="getPageToolbarStyle">
    <div class="row">
      <!-- <q-btn-dropdown color="primary" icon="my_location"> -->
      <q-btn-dropdown color="primary" :icon="iconChartType">
        <q-list>
          <q-item clickable v-close-popup @click="onItemClickByKP">
            <q-item-section>
              <q-item-label>По времени КП</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="onItemClickFullTimeByKp">
            <q-item-section>
              <q-item-label>Общее время</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="onItemClickByPlaces">
            <q-item-section>
              <q-item-label>По месту</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-select
        outlined
        v-model="selectModel"
        :options="selectOptions"
        label="Группа"
        style="width: 300px; background-color: beige; margin-left: 10px"
        @update:model-value="loadData()"
      />
    </div>
  </q-page>
  <q-page :style-fn="getPageStyle">
    <line-chart-component
      :chartData="barData"
      :chartOptions="barChartOptions"
      style="padding: 10px; margin: 10px"
    ></line-chart-component>
  </q-page>
</template>

<script lang="ts">
import { ChartData, BarChartOpts } from 'components/models';
import LineChartComponent from 'src/components/LineChartComponent.vue';
import { defineComponent, ref } from 'vue';
import moment from 'moment';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const apiData = ref(null);
const statData = ref(null);
const barData = ref(null);
const chartType = ref('ByKP');
const iconChartType = ref('my_location');
const comparsionGroup = ref('legendComparsion');
let coloRs = ['#ffffff', '#00e600', '#0000ff', '#006666'];

var dynamicColors = function () {
  var r = Math.floor(Math.random() * 255);
  var g = Math.floor(Math.random() * 255);
  var b = Math.floor(Math.random() * 255);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
};

for (let i = 1; i <= 250; i++) {
  coloRs.push(dynamicColors());
}

let kps = ['31', '90'];
let times = ['00:00:10', '00:00:01'];
let prepData = kps.map((kp, index) => ({
  x: kp,
  y: moment(`1970-02-01 ${times[index]}`).valueOf(),
}));
barData.value = {
  datasets: [
    {
      label: 'sprsmn.name',
      group: 'sprsmn.group',
      borderColor: '#bb2200',
      backgroundColor: '#aa3300',
      data: prepData,
      hidden: true,
    },
  ],
};

export default defineComponent({
  name: 'IndexPage',
  components: { LineChartComponent },
  setup() {
    const selectModel = ref('...');
    const selectOptions = ref(['Группа']);

    const sprtsmnsList = ref(['']);

    function loadData() {
      console.log('load data method start');
      let urlParams = new URLSearchParams(window.location.search);
      api
        .get('/stat?uri=' + urlParams.get('uri'))
        .then((response) => {
          apiData.value = response.data;

          if (chartType.value === 'ByKP') {
            statData.value = apiData.value.map((sprsmn) => ({
              label: sprsmn.resultPlace + '. ' + sprsmn.name,
              group: sprsmn.group,
              resultIndex: sprsmn.resultPlace,
              hidden: isLineHidden(sprsmn),
              borderColor: coloRs[sprsmn.resultPlace],
              backgroundColor: '#ffcc99',
              data: sprsmn.controlPoints.map((cp) => ({
                x: cp.pointNumber,
                y: moment(`1970-02-01 ${cp.duration}`).valueOf(),
              })),
              cubicInterpolationMode: 'monotone',
              tension: 0.4,
            }));
          } else if (chartType.value === 'FullTimeByKP') {
            statData.value = apiData.value.map((sprsmn) => ({
              label: sprsmn.resultPlace + '. ' + sprsmn.name,
              group: sprsmn.group,
              resultIndex: sprsmn.resultPlace,
              hidden: isLineHidden(sprsmn),
              borderColor: coloRs[sprsmn.resultPlace],
              backgroundColor: '#ffcc99',
              data: sprsmn.controlPoints.map((cp, index) => ({
                x: cp.pointNumber,
                y:
                  moment(`1970-02-01 ${cp.duration}`).valueOf() -
                  moment('1970-02-01 00:00:00').valueOf(),
              })),
              cubicInterpolationMode: 'monotone',
              tension: 0.4,
            }));

            // assessment

            statData.value.forEach((element) => {
              element.data = element.data.map((cp, index) => ({
                x: cp.x,
                y:
                  element.data.slice(0, index + 1).reduce(function (acc, obj) {
                    return acc + obj.y;
                  }, 0) + moment('1970-02-01 00:00:00').valueOf(),
              }));
            });
          } else {
            statData.value = apiData.value.map((sprsmn) => ({
              label: sprsmn.resultPlace + '. ' + sprsmn.name,
              group: sprsmn.group,
              resultIndex: sprsmn.resultPlace,
              hidden: isLineHidden(sprsmn),
              borderColor: coloRs[sprsmn.resultPlace],
              backgroundColor: '#ffcc99',
              data: sprsmn.cumulativeControlPoints.map((cp) => ({
                x: cp.pointNumber,
                y: cp.place,
              })),
              cubicInterpolationMode: 'monotone',
              tension: 0.4,
            }));
          }

          selectOptions.value = statData.value?.map((s) => s.group);
          function onlyUnique(value, index, array) {
            return array.indexOf(value) === index;
          }
          selectOptions.value = selectOptions.value.filter(onlyUnique);

          statData.value = statData.value?.filter(function (el) {
            return el.group === selectModel.value;
          });

          sprtsmnsList.value = statData.value?.map((s) => s.label);

          barData.value = {
            datasets: statData.value,
          };
        })
        .catch(() => {
          console.log('no data!');
        });

      function isLineHidden(sprsmn: any) {
        return sprsmn.resultPlace === '1' || sprsmn.resultPlace === '2'
          ? false
          : true;
      }
    }

    function getPageStyle(offset, height) {
      return {
        height: `${height - offset - 150}px`,
      };
    }

    function getPageToolbarStyle(offset, height) {
      return {
        height: '100px',
        margin: '5px',
      };
    }

    loadData();

    const barChartOptions = ref<BarChartOpts>({
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          position: 'right',
          align: 'center',
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem, data) => {
              // data for manipulation
              return (
                tooltipItem.dataset.label +
                (chartType.value != 'ByPlaces'
                  ? ': ' +
                    moment
                      .utc(
                        tooltipItem.dataset.data[tooltipItem.dataIndex].y -
                          moment('1970-02-01 00:00:00').valueOf()
                      )
                      .format('HH:mm:ss')
                  : '')
              );
            },
            footer: (tooltipItems) => {
              let sum = 0;
              return '';
            },
          },
        },
      },
      scales: {
        x: { position: 'top' },
        x1: { position: 'bottom' },
        y: {
          reverse: true,
          ticks: {
            stepSize: 1,
            callback: function (value, index, ticks) {
              return chartType.value != 'ByPlaces'
                ? moment
                    .utc(value - moment('1970-02-01 00:00:00').valueOf())
                    .format('HH:mm:ss')
                : value;
            },
          },
        },
      },
    });

    function onItemClickByKP() {
      chartType.value = 'ByKP';
      iconChartType.value = 'my_location';
      loadData();
    }
    function onItemClickFullTimeByKp() {
      chartType.value = 'FullTimeByKP';
      iconChartType.value = 'timer';
      loadData();
    }
    function onItemClickByPlaces() {
      chartType.value = 'ByPlaces';
      iconChartType.value = 'assessment';
      loadData();
    }

    return {
      barData,
      barChartOptions,
      selectModel,
      selectOptions,
      loadData,
      getPageStyle,
      getPageToolbarStyle,
      sprtsmnsList,
      onItemClickFullTimeByKp,
      onItemClickByKP,
      onItemClickByPlaces,
      chartType,
      iconChartType,
      selectComparsionOptions: [
        { label: 'Сравнение в легенде', value: 'legendComparsion' },
        { label: 'Сравнение двоих', value: 'twoComparsion' },
      ],
      comparsionGroup,
    };
  },
});
</script>
