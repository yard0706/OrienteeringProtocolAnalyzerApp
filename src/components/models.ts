export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

// export interface ChartData {
//   labels: string[];
//   datasets: [
//     {
//       label: string;
//       borderColor: string;
//       backgroundColor: string;
//       data: [
//         {
//           x: string;
//           y: number;
//         }
//       ];
//     }
//   ];
// }
export interface ChartData {
  datasets: [];
}

export interface BarChartOpts {}
