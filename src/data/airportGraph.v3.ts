// Airport Graph V3 - Master Production (TSN Airport)
// Generated strictly and exclusively from v3_raw_traces_manual.json (Clean 37 lines, 120 points)
// Source SHA-256: 25865bdf9603a075640c31da455c071d9dff997224ed770ff84cfc30fac74284
// Total Nodes: 120
// Total Edges: 133
// Coordinate System: SVG [0..1200] x [0..860] aligned to /anhchinh.png

import type { AirportGraph, AirportNode } from '../types';
import rawTracesManualData from './v3_raw_traces_manual.json';

export const SVG_WIDTH = 1200;
export const SVG_HEIGHT = 860;

// Dynamic label lookup map by Stable Node ID and Coordinate Key from v3_raw_traces_manual.json
const rawTraceLabelMapById = new Map<string, string>();
const rawTraceLabelMapByCoord = new Map<string, string>();

(rawTracesManualData as any[]).forEach(line => {
  if (!line || !Array.isArray(line.points)) return;
  line.points.forEach((p: any, idx: number) => {
    const idKey = `v3_${line.id}_p${String(idx).padStart(2, '0')}`;
    const coordKey = `${Math.round(p.x)}_${Math.round(p.y)}`;
    const label = typeof p.label === 'string' ? p.label.trim() : '';
    rawTraceLabelMapById.set(idKey, label);
    if (label) {
      rawTraceLabelMapByCoord.set(coordKey, label);
    }
  });
});

const baseNodes: AirportNode[] = [
    {
        "id": "v3_line_01_p00",
        "label": "07L",
        "type": "holding_point",
        "x": 56,
        "y": 486
    },
    {
        "id": "v3_line_01_p01",
        "label": "",
        "type": "taxiway",
        "x": 225,
        "y": 400
    },
    {
        "id": "v3_line_01_p02",
        "label": "",
        "type": "taxiway",
        "x": 843,
        "y": 97
    },
    {
        "id": "v3_line_01_p03",
        "label": "STOP BAR 25R",
        "type": "holding_point",
        "x": 931,
        "y": 57
    },
    {
        "id": "v3_line_03_p00",
        "label": "W5/07L",
        "type": "holding_point",
        "x": 63,
        "y": 484
    },
    {
        "id": "v3_line_03_p_mid",
        "label": "W5 MID",
        "type": "holding_point",
        "x": 65,
        "y": 593
    },
    {
        "id": "v3_line_03_p01",
        "label": "W5/07R",
        "type": "taxiway",
        "x": 66,
        "y": 703
    },
    {
        "id": "v3_line_04_p00",
        "label": "",
        "type": "taxiway",
        "x": 224,
        "y": 400
    },
    {
        "id": "v3_line_04_p01",
        "label": "W4/25R",
        "type": "taxiway",
        "x": 223,
        "y": 434
    },
    {
        "id": "v3_line_04_p02",
        "label": "",
        "type": "taxiway",
        "x": 210,
        "y": 529
    },
    {
        "id": "v3_line_04_p03",
        "label": "W4/25L",
        "type": "taxiway",
        "x": 227,
        "y": 603
    },
    {
        "id": "v3_line_04_p04",
        "label": "",
        "type": "taxiway",
        "x": 235,
        "y": 619
    },
    {
        "id": "v3_line_04_p05",
        "label": "",
        "type": "taxiway",
        "x": 235,
        "y": 619
    },
    {
        "id": "v3_line_05_p00",
        "label": "07R",
        "type": "holding_point",
        "x": 52,
        "y": 712
    },
    {
        "id": "v3_line_05_p01",
        "label": "",
        "type": "taxiway",
        "x": 232,
        "y": 620
    },
    {
        "id": "v3_line_05_p02",
        "label": "",
        "type": "taxiway",
        "x": 445,
        "y": 514
    },
    {
        "id": "v3_line_05_p03",
        "label": "",
        "type": "taxiway",
        "x": 633,
        "y": 421
    },
    {
        "id": "v3_line_05_p04",
        "label": "",
        "type": "taxiway",
        "x": 819,
        "y": 331
    },
    {
        "id": "v3_line_05_p05",
        "label": "T63",
        "type": "holding_point",
        "x": 919,
        "y": 282
    },
    {
        "id": "v3_line_05_p06",
        "label": "",
        "type": "taxiway",
        "x": 965,
        "y": 260
    },
    {
        "id": "v3_line_05_p07",
        "label": "",
        "type": "taxiway",
        "x": 1136,
        "y": 177
    },
    {
        "id": "v3_line_06_p00",
        "label": "L12_P0",
        "type": "taxiway",
        "x": 837,
        "y": 102
    },
    {
        "id": "v3_line_06_p01",
        "label": "NS1/25R",
        "type": "taxiway",
        "x": 839,
        "y": 124
    },
    {
        "id": "v3_line_06_p02",
        "label": "NS1/25L",
        "type": "taxiway",
        "x": 826,
        "y": 280
    },
    {
        "id": "v3_line_06_p03",
        "label": "",
        "type": "taxiway",
        "x": 821,
        "y": 331
    },
    {
        "id": "v3_line_07_p00",
        "label": "",
        "type": "taxiway",
        "x": 825,
        "y": 281
    },
    {
        "id": "v3_line_07_p01",
        "label": "",
        "type": "taxiway",
        "x": 852,
        "y": 316
    },
    {
        "id": "v3_line_08_p00",
        "label": "",
        "type": "taxiway",
        "x": 934,
        "y": 58
    },
    {
        "id": "v3_line_08_p01",
        "label": "",
        "type": "taxiway",
        "x": 937,
        "y": 81
    },
    {
        "id": "v3_line_08_p02",
        "label": "E1/25L",
        "type": "taxiway",
        "x": 926,
        "y": 226
    },
    {
        "id": "v3_line_08_p03",
        "label": "",
        "type": "taxiway",
        "x": 920,
        "y": 280
    },
    {
        "id": "v3_line_09_p00",
        "label": "",
        "type": "taxiway",
        "x": 924,
        "y": 234
    },
    {
        "id": "v3_line_09_p01",
        "label": "",
        "type": "taxiway",
        "x": 950,
        "y": 266
    },
    {
        "id": "v3_line_10_p00",
        "label": "",
        "type": "taxiway",
        "x": 440,
        "y": 520
    },
    {
        "id": "v3_line_10_p01",
        "label": "W5/25L",
        "type": "taxiway",
        "x": 440,
        "y": 543
    },
    {
        "id": "v3_line_10_p02",
        "label": "T26",
        "type": "taxiway",
        "x": 433,
        "y": 577
    },
    {
        "id": "v3_line_10_p03",
        "label": "",
        "type": "taxiway",
        "x": 441,
        "y": 624
    },
    {
        "id": "v3_line_10_p04",
        "label": "W9B/M5",
        "type": "taxiway",
        "x": 432,
        "y": 651
    },
    {
        "id": "v3_line_11_p00",
        "label": "",
        "type": "taxiway",
        "x": 439,
        "y": 619
    },
    {
        "id": "v3_line_11_p01",
        "label": "",
        "type": "taxiway",
        "x": 459,
        "y": 639
    },
    {
        "id": "v3_line_12_p00",
        "label": "",
        "type": "taxiway",
        "x": 820,
        "y": 330
    },
    {
        "id": "v3_line_12_p01",
        "label": "NS2/25L",
        "type": "taxiway",
        "x": 817,
        "y": 353
    },
    {
        "id": "v3_line_12_p02",
        "label": "E6/NS2",
        "type": "taxiway",
        "x": 811,
        "y": 436
    },
    {
        "id": "v3_line_12_p03",
        "label": "T69",
        "type": "taxiway",
        "x": 796,
        "y": 620
    },
    {
        "id": "v3_line_12_p04",
        "label": "",
        "type": "taxiway",
        "x": 783,
        "y": 788
    },
    {
        "id": "v3_line_13_p00",
        "label": "",
        "type": "taxiway",
        "x": 920,
        "y": 280
    },
    {
        "id": "v3_line_13_p01",
        "label": "E2/25L",
        "type": "taxiway",
        "x": 916,
        "y": 306
    },
    {
        "id": "v3_line_13_p02",
        "label": "E6/E2",
        "type": "taxiway",
        "x": 910,
        "y": 399
    },
    {
        "id": "v3_line_13_p03",
        "label": "",
        "type": "taxiway",
        "x": 911,
        "y": 430
    },
    {
        "id": "v3_line_15_p00",
        "label": "",
        "type": "stand",
        "x": 910,
        "y": 408
    },
    {
        "id": "v3_line_15_p01",
        "label": "INTL_S2",
        "type": "stand",
        "x": 926,
        "y": 423
    },
    {
        "id": "v3_line_16_p00",
        "label": "W5/07R",
        "type": "taxiway",
        "x": 67,
        "y": 704
    },
    {
        "id": "v3_line_16_p01",
        "label": "W11/07R",
        "type": "holding_point",
        "x": 71,
        "y": 730
    },
    {
        "id": "v3_line_16_p02",
        "label": "",
        "type": "taxiway",
        "x": 83,
        "y": 774
    },
    {
        "id": "v3_line_16_p03",
        "label": "",
        "type": "taxiway",
        "x": 96,
        "y": 797
    },
    {
        "id": "v3_line_16_p04",
        "label": "",
        "type": "taxiway",
        "x": 127,
        "y": 801
    },
    {
        "id": "v3_line_17_p00",
        "label": "L03_P3",
        "type": "taxiway",
        "x": 86,
        "y": 697
    },
    {
        "id": "v3_line_17_p01",
        "label": "W9A/07R",
        "type": "taxiway",
        "x": 91,
        "y": 718
    },
    {
        "id": "v3_line_17_p02",
        "label": "",
        "type": "taxiway",
        "x": 111,
        "y": 785
    },
    {
        "id": "v3_line_17_p03",
        "label": "",
        "type": "taxiway",
        "x": 126,
        "y": 799
    },
    {
        "id": "v3_line_17_p04",
        "label": "W9B",
        "type": "taxiway",
        "x": 141,
        "y": 798
    },
    {
        "id": "v3_line_17_p05",
        "label": "",
        "type": "taxiway",
        "x": 328,
        "y": 703
    },
    {
        "id": "v3_line_17_p06",
        "label": "T27",
        "type": "taxiway",
        "x": 446,
        "y": 645
    },
    {
        "id": "v3_line_17_p07",
        "label": "L21_P3",
        "type": "taxiway",
        "x": 716,
        "y": 517
    },
    {
        "id": "v3_line_17_p08",
        "label": "",
        "type": "taxiway",
        "x": 754,
        "y": 500
    },
    {
        "id": "v3_line_17_p09",
        "label": "HS_NS",
        "type": "taxiway",
        "x": 809,
        "y": 476
    },
    {
        "id": "v3_line_17_p10",
        "label": "",
        "type": "taxiway",
        "x": 839,
        "y": 461
    },
    {
        "id": "v3_line_17_p11",
        "label": "",
        "type": "taxiway",
        "x": 1052,
        "y": 366
    },
    {
        "id": "v3_line_17_p12",
        "label": "T39",
        "type": "taxiway",
        "x": 1074,
        "y": 356
    },
    {
        "id": "v3_line_17_p13",
        "label": "E6",
        "type": "taxiway",
        "x": 1152,
        "y": 321
    },
    {
        "id": "v3_line_17_p14",
        "label": "",
        "type": "taxiway",
        "x": 1190,
        "y": 223
    },
    {
        "id": "v3_line_17_p15",
        "label": "L03_P18",
        "type": "taxiway",
        "x": 1184,
        "y": 206
    },
    {
        "id": "v3_line_17_p16",
        "label": "STOP BAR 25L",
        "type": "taxiway",
        "x": 1136,
        "y": 176
    },
    {
        "id": "v3_line_18_p00",
        "label": "",
        "type": "taxiway",
        "x": 236,
        "y": 622
    },
    {
        "id": "v3_line_18_p01",
        "label": "W7A/25L",
        "type": "taxiway",
        "x": 240,
        "y": 642
    },
    {
        "id": "v3_line_18_p02",
        "label": "",
        "type": "taxiway",
        "x": 256,
        "y": 682
    },
    {
        "id": "v3_line_18_p03",
        "label": "W9B/W7A",
        "type": "taxiway",
        "x": 320,
        "y": 707
    },
    {
        "id": "v3_line_19_p00",
        "label": "",
        "type": "taxiway",
        "x": 633,
        "y": 422
    },
    {
        "id": "v3_line_19_p01",
        "label": "W3/25L",
        "type": "taxiway",
        "x": 648,
        "y": 439
    },
    {
        "id": "v3_line_19_p02",
        "label": "",
        "type": "taxiway",
        "x": 717,
        "y": 490
    },
    {
        "id": "v3_line_19_p03",
        "label": "HS_W7",
        "type": "taxiway",
        "x": 735,
        "y": 509
    },
    {
        "id": "v3_line_21_p00",
        "label": "",
        "type": "taxiway",
        "x": 878,
        "y": 447
    },
    {
        "id": "v3_line_21_p01",
        "label": "STAND_16",
        "type": "taxiway",
        "x": 887,
        "y": 482
    },
    {
        "id": "v3_line_22_p00",
        "label": "",
        "type": "taxiway",
        "x": 915,
        "y": 430
    },
    {
        "id": "v3_line_22_p01",
        "label": "STAND_17",
        "type": "taxiway",
        "x": 925,
        "y": 466
    },
    {
        "id": "v3_line_23_p00",
        "label": "INTL_S3",
        "type": "stand",
        "x": 946,
        "y": 412
    },
    {
        "id": "v3_line_23_p01",
        "label": "STAND_18",
        "type": "taxiway",
        "x": 957,
        "y": 448
    },
    {
        "id": "v3_line_24_p00",
        "label": "INTL_S4",
        "type": "stand",
        "x": 981,
        "y": 398
    },
    {
        "id": "v3_line_24_p01",
        "label": "STAND_20",
        "type": "taxiway",
        "x": 990,
        "y": 434
    },
    {
        "id": "v3_line_25_p00",
        "label": "T38",
        "type": "taxiway",
        "x": 1018,
        "y": 383
    },
    {
        "id": "v3_line_25_p01",
        "label": "STAND_21",
        "type": "taxiway",
        "x": 1029,
        "y": 415
    },
    {
        "id": "v3_line_26_p00",
        "label": "",
        "type": "taxiway",
        "x": 969,
        "y": 259
    },
    {
        "id": "v3_line_26_p01",
        "label": "E4/25L",
        "type": "taxiway",
        "x": 996,
        "y": 270
    },
    {
        "id": "v3_line_26_p02",
        "label": "T35",
        "type": "taxiway",
        "x": 1036,
        "y": 293
    },
    {
        "id": "v3_line_26_p03",
        "label": "E6/E4",
        "type": "taxiway",
        "x": 1063,
        "y": 356
    },
    {
        "id": "v3_line_26_p04",
        "label": "STAND_22",
        "type": "taxiway",
        "x": 1072,
        "y": 397
    },
    {
        "id": "v3_line_27_p00",
        "label": "",
        "type": "taxiway",
        "x": 803,
        "y": 532
    },
    {
        "id": "v3_line_27_p01",
        "label": "STAND_9",
        "type": "taxiway",
        "x": 844,
        "y": 535
    },
    {
        "id": "v3_line_28_p00",
        "label": "",
        "type": "taxiway",
        "x": 800,
        "y": 575
    },
    {
        "id": "v3_line_28_p01",
        "label": "STAND_8",
        "type": "taxiway",
        "x": 839,
        "y": 579
    },
    {
        "id": "v3_line_29_p00",
        "label": "",
        "type": "taxiway",
        "x": 797,
        "y": 620
    },
    {
        "id": "v3_line_29_p01",
        "label": "STAND_7",
        "type": "taxiway",
        "x": 835,
        "y": 623
    },
    {
        "id": "v3_line_30_p00",
        "label": "STAND_13",
        "type": "taxiway",
        "x": 765,
        "y": 579
    },
    {
        "id": "v3_line_30_p01",
        "label": "L28_ENT",
        "type": "taxiway",
        "x": 798,
        "y": 583
    },
    {
        "id": "v3_line_31_p00",
        "label": "STAND_12",
        "type": "taxiway",
        "x": 761,
        "y": 615
    },
    {
        "id": "v3_line_31_p01",
        "label": "",
        "type": "taxiway",
        "x": 796,
        "y": 618
    },
    {
        "id": "v3_line_32_p00",
        "label": "STAND_11",
        "type": "taxiway",
        "x": 762,
        "y": 658
    },
    {
        "id": "v3_line_32_p01",
        "label": "",
        "type": "taxiway",
        "x": 791,
        "y": 661
    },
    {
        "id": "v3_line_33_p00",
        "label": "STAND_10",
        "type": "taxiway",
        "x": 759,
        "y": 697
    },
    {
        "id": "v3_line_33_p01",
        "label": "",
        "type": "taxiway",
        "x": 789,
        "y": 700
    },
    {
        "id": "v3_line_34_p00",
        "label": "NS1_SOUTH_END_V2",
        "type": "taxiway",
        "x": 786,
        "y": 768
    },
    {
        "id": "v3_line_34_p01",
        "label": "",
        "type": "taxiway",
        "x": 853,
        "y": 777
    },
    {
        "id": "v3_line_34_p02",
        "label": "STAND_3",
        "type": "taxiway",
        "x": 852,
        "y": 814
    },
    {
        "id": "v3_line_35_p00",
        "label": "STAND_4",
        "type": "taxiway",
        "x": 817,
        "y": 743
    },
    {
        "id": "v3_line_35_p01",
        "label": "",
        "type": "taxiway",
        "x": 815,
        "y": 770
    },
    {
        "id": "v3_line_36_p00",
        "label": "STAND_5",
        "type": "taxiway",
        "x": 839,
        "y": 744
    },
    {
        "id": "v3_line_36_p01",
        "label": "",
        "type": "taxiway",
        "x": 836,
        "y": 772
    },
    {
        "id": "v3_line_37_p00",
        "label": "STAND_1",
        "type": "taxiway",
        "x": 811,
        "y": 812
    },
    {
        "id": "v3_line_37_p01",
        "label": "",
        "type": "taxiway",
        "x": 815,
        "y": 771
    },
    {
        "id": "v3_line_38_p00",
        "label": "STAND_2",
        "type": "taxiway",
        "x": 831,
        "y": 810
    },
    {
        "id": "v3_line_38_p01",
        "label": "",
        "type": "taxiway",
        "x": 835,
        "y": 772
    }
];

export const airportGraphV3: AirportGraph = {
  nodes: baseNodes.map(n => {
    const coordKey = `${Math.round(n.x)}_${Math.round(n.y)}`;
    let dynamicLabel = rawTraceLabelMapById.get(n.id);
    if (dynamicLabel === undefined) {
      dynamicLabel = rawTraceLabelMapByCoord.get(coordKey) ?? n.label;
    }
    return {
      ...n,
      label: dynamicLabel ?? '',
    };
  }),
  edges: [
    {
        "id": "E_v3_line_01_p00_v3_line_03_p00",
        "fromNodeId": "v3_line_01_p00",
        "toNodeId": "v3_line_03_p00",
        "lengthMeters": 21.8,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_03_p00_v3_line_04_p00",
        "fromNodeId": "v3_line_03_p00",
        "toNodeId": "v3_line_04_p00",
        "lengthMeters": 544.8,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_04_p00_v3_line_01_p01",
        "fromNodeId": "v3_line_04_p00",
        "toNodeId": "v3_line_01_p01",
        "lengthMeters": 3,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_01_p01_v3_line_06_p00",
        "fromNodeId": "v3_line_01_p01",
        "toNodeId": "v3_line_06_p00",
        "lengthMeters": 2042.1,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_06_p00_v3_line_01_p02",
        "fromNodeId": "v3_line_06_p00",
        "toNodeId": "v3_line_01_p02",
        "lengthMeters": 23.4,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_01_p02_v3_line_01_p03",
        "fromNodeId": "v3_line_01_p02",
        "toNodeId": "v3_line_01_p03",
        "lengthMeters": 290,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_03_p00_v3_line_03_p_mid",
        "fromNodeId": "v3_line_03_p00",
        "toNodeId": "v3_line_03_p_mid",
        "lengthMeters": 328.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_03_p_mid_v3_line_03_p01",
        "fromNodeId": "v3_line_03_p_mid",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 328.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_04_p00_v3_line_04_p01",
        "fromNodeId": "v3_line_04_p00",
        "toNodeId": "v3_line_04_p01",
        "lengthMeters": 102,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_04_p01_v3_line_04_p02",
        "fromNodeId": "v3_line_04_p01",
        "toNodeId": "v3_line_04_p02",
        "lengthMeters": 287.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_04_p02_v3_line_04_p03",
        "fromNodeId": "v3_line_04_p02",
        "toNodeId": "v3_line_04_p03",
        "lengthMeters": 227.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_04_p03_v3_line_05_p01",
        "fromNodeId": "v3_line_04_p03",
        "toNodeId": "v3_line_05_p01",
        "lengthMeters": 53.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p01_v3_line_04_p04",
        "fromNodeId": "v3_line_05_p01",
        "toNodeId": "v3_line_04_p04",
        "lengthMeters": 9.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_04_p04_v3_line_04_p05",
        "fromNodeId": "v3_line_04_p04",
        "toNodeId": "v3_line_04_p05",
        "lengthMeters": 1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p00_v3_line_03_p01",
        "fromNodeId": "v3_line_05_p00",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 49.9,
        "maxSpeedKts": 30,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_03_p01_v3_line_16_p00",
        "fromNodeId": "v3_line_03_p01",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 4.2,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_16_p00_v3_line_17_p00",
        "fromNodeId": "v3_line_16_p00",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 60.7,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p00_v3_line_05_p01",
        "fromNodeId": "v3_line_17_p00",
        "toNodeId": "v3_line_05_p01",
        "lengthMeters": 495.2,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_04_p05_v3_line_10_p00",
        "fromNodeId": "v3_line_04_p05",
        "toNodeId": "v3_line_10_p00",
        "lengthMeters": 683,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_10_p00_v3_line_05_p02",
        "fromNodeId": "v3_line_10_p00",
        "toNodeId": "v3_line_05_p02",
        "lengthMeters": 23.4,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p02_v3_line_19_p00",
        "fromNodeId": "v3_line_05_p02",
        "toNodeId": "v3_line_19_p00",
        "lengthMeters": 627.9,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_19_p00_v3_line_05_p03",
        "fromNodeId": "v3_line_19_p00",
        "toNodeId": "v3_line_05_p03",
        "lengthMeters": 3,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p03_v3_line_05_p04",
        "fromNodeId": "v3_line_05_p03",
        "toNodeId": "v3_line_05_p04",
        "lengthMeters": 619.9,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p04_v3_line_12_p00",
        "fromNodeId": "v3_line_05_p04",
        "toNodeId": "v3_line_12_p00",
        "lengthMeters": 4.2,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_12_p00_v3_line_06_p03",
        "fromNodeId": "v3_line_12_p00",
        "toNodeId": "v3_line_06_p03",
        "lengthMeters": 4.2,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_06_p03_v3_line_07_p01",
        "fromNodeId": "v3_line_06_p03",
        "toNodeId": "v3_line_07_p01",
        "lengthMeters": 103.3,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_07_p01_v3_line_05_p05",
        "fromNodeId": "v3_line_07_p01",
        "toNodeId": "v3_line_05_p05",
        "lengthMeters": 225.4,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p05_v3_line_08_p03",
        "fromNodeId": "v3_line_05_p05",
        "toNodeId": "v3_line_08_p03",
        "lengthMeters": 6.7,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_08_p03_v3_line_13_p00",
        "fromNodeId": "v3_line_08_p03",
        "toNodeId": "v3_line_13_p00",
        "lengthMeters": 1,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_13_p00_v3_line_09_p01",
        "fromNodeId": "v3_line_13_p00",
        "toNodeId": "v3_line_09_p01",
        "lengthMeters": 99.3,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_09_p01_v3_line_05_p06",
        "fromNodeId": "v3_line_09_p01",
        "toNodeId": "v3_line_05_p06",
        "lengthMeters": 48.5,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p06_v3_line_26_p00",
        "fromNodeId": "v3_line_05_p06",
        "toNodeId": "v3_line_26_p00",
        "lengthMeters": 12.4,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_26_p00_v3_line_05_p07",
        "fromNodeId": "v3_line_26_p00",
        "toNodeId": "v3_line_05_p07",
        "lengthMeters": 558.1,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_06_p00_v3_line_06_p01",
        "fromNodeId": "v3_line_06_p00",
        "toNodeId": "v3_line_06_p01",
        "lengthMeters": 66.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_06_p01_v3_line_06_p02",
        "fromNodeId": "v3_line_06_p01",
        "toNodeId": "v3_line_06_p02",
        "lengthMeters": 469.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_06_p02_v3_line_07_p00",
        "fromNodeId": "v3_line_06_p02",
        "toNodeId": "v3_line_07_p00",
        "lengthMeters": 4.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_07_p00_v3_line_12_p00",
        "fromNodeId": "v3_line_07_p00",
        "toNodeId": "v3_line_12_p00",
        "lengthMeters": 147.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_07_p00_v3_line_07_p01",
        "fromNodeId": "v3_line_07_p00",
        "toNodeId": "v3_line_07_p01",
        "lengthMeters": 132.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_08_p00_v3_line_08_p01",
        "fromNodeId": "v3_line_08_p00",
        "toNodeId": "v3_line_08_p01",
        "lengthMeters": 69.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_08_p01_v3_line_08_p02",
        "fromNodeId": "v3_line_08_p01",
        "toNodeId": "v3_line_08_p02",
        "lengthMeters": 436.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_08_p02_v3_line_09_p00",
        "fromNodeId": "v3_line_08_p02",
        "toNodeId": "v3_line_09_p00",
        "lengthMeters": 24.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_09_p00_v3_line_08_p03",
        "fromNodeId": "v3_line_09_p00",
        "toNodeId": "v3_line_08_p03",
        "lengthMeters": 138.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_09_p00_v3_line_09_p01",
        "fromNodeId": "v3_line_09_p00",
        "toNodeId": "v3_line_09_p01",
        "lengthMeters": 123.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_10_p00_v3_line_10_p01",
        "fromNodeId": "v3_line_10_p00",
        "toNodeId": "v3_line_10_p01",
        "lengthMeters": 69,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_10_p01_v3_line_10_p02",
        "fromNodeId": "v3_line_10_p01",
        "toNodeId": "v3_line_10_p02",
        "lengthMeters": 104.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_10_p02_v3_line_11_p00",
        "fromNodeId": "v3_line_10_p02",
        "toNodeId": "v3_line_11_p00",
        "lengthMeters": 127.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_11_p00_v3_line_10_p03",
        "fromNodeId": "v3_line_11_p00",
        "toNodeId": "v3_line_10_p03",
        "lengthMeters": 16.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_10_p03_v3_line_10_p04",
        "fromNodeId": "v3_line_10_p03",
        "toNodeId": "v3_line_10_p04",
        "lengthMeters": 85.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_10_p03_v3_line_11_p01",
        "fromNodeId": "v3_line_10_p03",
        "toNodeId": "v3_line_11_p01",
        "lengthMeters": 70.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_06_p03_v3_line_05_p04",
        "fromNodeId": "v3_line_06_p03",
        "toNodeId": "v3_line_05_p04",
        "lengthMeters": 6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p04_v3_line_12_p01",
        "fromNodeId": "v3_line_05_p04",
        "toNodeId": "v3_line_12_p01",
        "lengthMeters": 66.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_12_p01_v3_line_12_p02",
        "fromNodeId": "v3_line_12_p01",
        "toNodeId": "v3_line_12_p02",
        "lengthMeters": 249.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_12_p02_v3_line_17_p09",
        "fromNodeId": "v3_line_12_p02",
        "toNodeId": "v3_line_17_p09",
        "lengthMeters": 120.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p09_v3_line_27_p00",
        "fromNodeId": "v3_line_17_p09",
        "toNodeId": "v3_line_27_p00",
        "lengthMeters": 169,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_27_p00_v3_line_28_p00",
        "fromNodeId": "v3_line_27_p00",
        "toNodeId": "v3_line_28_p00",
        "lengthMeters": 129.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_28_p00_v3_line_30_p01",
        "fromNodeId": "v3_line_28_p00",
        "toNodeId": "v3_line_30_p01",
        "lengthMeters": 24.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_30_p01_v3_line_31_p01",
        "fromNodeId": "v3_line_30_p01",
        "toNodeId": "v3_line_31_p01",
        "lengthMeters": 105.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_31_p01_v3_line_12_p03",
        "fromNodeId": "v3_line_31_p01",
        "toNodeId": "v3_line_12_p03",
        "lengthMeters": 6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_12_p03_v3_line_32_p01",
        "fromNodeId": "v3_line_12_p03",
        "toNodeId": "v3_line_32_p01",
        "lengthMeters": 123.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_32_p01_v3_line_33_p01",
        "fromNodeId": "v3_line_32_p01",
        "toNodeId": "v3_line_33_p01",
        "lengthMeters": 117.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_33_p01_v3_line_34_p00",
        "fromNodeId": "v3_line_33_p01",
        "toNodeId": "v3_line_34_p00",
        "lengthMeters": 204.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_34_p00_v3_line_12_p04",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_12_p04",
        "lengthMeters": 60.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_13_p00_v3_line_05_p05",
        "fromNodeId": "v3_line_13_p00",
        "toNodeId": "v3_line_05_p05",
        "lengthMeters": 6.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p05_v3_line_13_p01",
        "fromNodeId": "v3_line_05_p05",
        "toNodeId": "v3_line_13_p01",
        "lengthMeters": 72.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_13_p01_v3_line_13_p02",
        "fromNodeId": "v3_line_13_p01",
        "toNodeId": "v3_line_13_p02",
        "lengthMeters": 279.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_13_p02_v3_line_15_p00",
        "fromNodeId": "v3_line_13_p02",
        "toNodeId": "v3_line_15_p00",
        "lengthMeters": 27,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_15_p00_v3_line_13_p03",
        "fromNodeId": "v3_line_15_p00",
        "toNodeId": "v3_line_13_p03",
        "lengthMeters": 66.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_15_p00_v3_line_15_p01",
        "fromNodeId": "v3_line_15_p00",
        "toNodeId": "v3_line_15_p01",
        "lengthMeters": 65.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_16_p00_v3_line_16_p01",
        "fromNodeId": "v3_line_16_p00",
        "toNodeId": "v3_line_16_p01",
        "lengthMeters": 78.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_16_p01_v3_line_16_p02",
        "fromNodeId": "v3_line_16_p01",
        "toNodeId": "v3_line_16_p02",
        "lengthMeters": 136.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_16_p02_v3_line_16_p03",
        "fromNodeId": "v3_line_16_p02",
        "toNodeId": "v3_line_16_p03",
        "lengthMeters": 79.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_16_p03_v3_line_17_p03",
        "fromNodeId": "v3_line_16_p03",
        "toNodeId": "v3_line_17_p03",
        "lengthMeters": 90.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p03_v3_line_16_p04",
        "fromNodeId": "v3_line_17_p03",
        "toNodeId": "v3_line_16_p04",
        "lengthMeters": 6.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p00_v3_line_17_p01",
        "fromNodeId": "v3_line_17_p00",
        "toNodeId": "v3_line_17_p01",
        "lengthMeters": 64.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p01_v3_line_17_p02",
        "fromNodeId": "v3_line_17_p01",
        "toNodeId": "v3_line_17_p02",
        "lengthMeters": 209.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p02_v3_line_17_p03",
        "fromNodeId": "v3_line_17_p02",
        "toNodeId": "v3_line_17_p03",
        "lengthMeters": 61.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_16_p04_v3_line_17_p04",
        "fromNodeId": "v3_line_16_p04",
        "toNodeId": "v3_line_17_p04",
        "lengthMeters": 43,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p04_v3_line_18_p03",
        "fromNodeId": "v3_line_17_p04",
        "toNodeId": "v3_line_18_p03",
        "lengthMeters": 602.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_18_p03_v3_line_17_p05",
        "fromNodeId": "v3_line_18_p03",
        "toNodeId": "v3_line_17_p05",
        "lengthMeters": 26.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p05_v3_line_10_p04",
        "fromNodeId": "v3_line_17_p05",
        "toNodeId": "v3_line_10_p04",
        "lengthMeters": 348.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_10_p04_v3_line_17_p06",
        "fromNodeId": "v3_line_10_p04",
        "toNodeId": "v3_line_17_p06",
        "lengthMeters": 45.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p06_v3_line_11_p01",
        "fromNodeId": "v3_line_17_p06",
        "toNodeId": "v3_line_11_p01",
        "lengthMeters": 43,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_11_p01_v3_line_17_p07",
        "fromNodeId": "v3_line_11_p01",
        "toNodeId": "v3_line_17_p07",
        "lengthMeters": 853.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p07_v3_line_19_p03",
        "fromNodeId": "v3_line_17_p07",
        "toNodeId": "v3_line_19_p03",
        "lengthMeters": 61.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_19_p03_v3_line_17_p08",
        "fromNodeId": "v3_line_19_p03",
        "toNodeId": "v3_line_17_p08",
        "lengthMeters": 63.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p08_v3_line_17_p09",
        "fromNodeId": "v3_line_17_p08",
        "toNodeId": "v3_line_17_p09",
        "lengthMeters": 180,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p09_v3_line_17_p10",
        "fromNodeId": "v3_line_17_p09",
        "toNodeId": "v3_line_17_p10",
        "lengthMeters": 100.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p10_v3_line_21_p00",
        "fromNodeId": "v3_line_17_p10",
        "toNodeId": "v3_line_21_p00",
        "lengthMeters": 124.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_21_p00_v3_line_13_p03",
        "fromNodeId": "v3_line_21_p00",
        "toNodeId": "v3_line_13_p03",
        "lengthMeters": 111.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_13_p03_v3_line_22_p00",
        "fromNodeId": "v3_line_13_p03",
        "toNodeId": "v3_line_22_p00",
        "lengthMeters": 12,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_22_p00_v3_line_15_p01",
        "fromNodeId": "v3_line_22_p00",
        "toNodeId": "v3_line_15_p01",
        "lengthMeters": 39.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_15_p01_v3_line_23_p00",
        "fromNodeId": "v3_line_15_p01",
        "toNodeId": "v3_line_23_p00",
        "lengthMeters": 68.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_23_p00_v3_line_24_p00",
        "fromNodeId": "v3_line_23_p00",
        "toNodeId": "v3_line_24_p00",
        "lengthMeters": 113.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_24_p00_v3_line_25_p00",
        "fromNodeId": "v3_line_24_p00",
        "toNodeId": "v3_line_25_p00",
        "lengthMeters": 119.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_25_p00_v3_line_17_p11",
        "fromNodeId": "v3_line_25_p00",
        "toNodeId": "v3_line_17_p11",
        "lengthMeters": 114,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p11_v3_line_17_p12",
        "fromNodeId": "v3_line_17_p11",
        "toNodeId": "v3_line_17_p12",
        "lengthMeters": 72.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p12_v3_line_17_p13",
        "fromNodeId": "v3_line_17_p12",
        "toNodeId": "v3_line_17_p13",
        "lengthMeters": 256.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p13_v3_line_17_p14",
        "fromNodeId": "v3_line_17_p13",
        "toNodeId": "v3_line_17_p14",
        "lengthMeters": 315.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p14_v3_line_17_p15",
        "fromNodeId": "v3_line_17_p14",
        "toNodeId": "v3_line_17_p15",
        "lengthMeters": 54.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_17_p15_v3_line_05_p07",
        "fromNodeId": "v3_line_17_p15",
        "toNodeId": "v3_line_05_p07",
        "lengthMeters": 168.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p07_v3_line_17_p16",
        "fromNodeId": "v3_line_05_p07",
        "toNodeId": "v3_line_17_p16",
        "lengthMeters": 3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_05_p01_v3_line_18_p00",
        "fromNodeId": "v3_line_05_p01",
        "toNodeId": "v3_line_18_p00",
        "lengthMeters": 13.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_18_p00_v3_line_18_p01",
        "fromNodeId": "v3_line_18_p00",
        "toNodeId": "v3_line_18_p01",
        "lengthMeters": 61.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_18_p01_v3_line_18_p02",
        "fromNodeId": "v3_line_18_p01",
        "toNodeId": "v3_line_18_p02",
        "lengthMeters": 129.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_18_p02_v3_line_18_p03",
        "fromNodeId": "v3_line_18_p02",
        "toNodeId": "v3_line_18_p03",
        "lengthMeters": 206.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_19_p00_v3_line_19_p01",
        "fromNodeId": "v3_line_19_p00",
        "toNodeId": "v3_line_19_p01",
        "lengthMeters": 68,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_19_p01_v3_line_19_p02",
        "fromNodeId": "v3_line_19_p01",
        "toNodeId": "v3_line_19_p02",
        "lengthMeters": 257.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_19_p02_v3_line_19_p03",
        "fromNodeId": "v3_line_19_p02",
        "toNodeId": "v3_line_19_p03",
        "lengthMeters": 78.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_21_p00_v3_line_21_p01",
        "fromNodeId": "v3_line_21_p00",
        "toNodeId": "v3_line_21_p01",
        "lengthMeters": 108.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_22_p00_v3_line_22_p01",
        "fromNodeId": "v3_line_22_p00",
        "toNodeId": "v3_line_22_p01",
        "lengthMeters": 112.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_23_p00_v3_line_23_p01",
        "fromNodeId": "v3_line_23_p00",
        "toNodeId": "v3_line_23_p01",
        "lengthMeters": 112.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_24_p00_v3_line_24_p01",
        "fromNodeId": "v3_line_24_p00",
        "toNodeId": "v3_line_24_p01",
        "lengthMeters": 111.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_25_p00_v3_line_25_p01",
        "fromNodeId": "v3_line_25_p00",
        "toNodeId": "v3_line_25_p01",
        "lengthMeters": 101.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_26_p00_v3_line_26_p01",
        "fromNodeId": "v3_line_26_p00",
        "toNodeId": "v3_line_26_p01",
        "lengthMeters": 87.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_26_p01_v3_line_26_p02",
        "fromNodeId": "v3_line_26_p01",
        "toNodeId": "v3_line_26_p02",
        "lengthMeters": 138.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_26_p02_v3_line_26_p03",
        "fromNodeId": "v3_line_26_p02",
        "toNodeId": "v3_line_26_p03",
        "lengthMeters": 205.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_26_p03_v3_line_17_p12",
        "fromNodeId": "v3_line_26_p03",
        "toNodeId": "v3_line_17_p12",
        "lengthMeters": 33.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_26_p03_v3_line_26_p04",
        "fromNodeId": "v3_line_26_p03",
        "toNodeId": "v3_line_26_p04",
        "lengthMeters": 125.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_27_p00_v3_line_27_p01",
        "fromNodeId": "v3_line_27_p00",
        "toNodeId": "v3_line_27_p01",
        "lengthMeters": 123.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_28_p00_v3_line_28_p01",
        "fromNodeId": "v3_line_28_p00",
        "toNodeId": "v3_line_28_p01",
        "lengthMeters": 117.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_29_p00_v3_line_29_p01",
        "fromNodeId": "v3_line_29_p00",
        "toNodeId": "v3_line_29_p01",
        "lengthMeters": 114.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_30_p00_v3_line_30_p01",
        "fromNodeId": "v3_line_30_p00",
        "toNodeId": "v3_line_30_p01",
        "lengthMeters": 99.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_31_p00_v3_line_31_p01",
        "fromNodeId": "v3_line_31_p00",
        "toNodeId": "v3_line_31_p01",
        "lengthMeters": 105.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_32_p00_v3_line_32_p01",
        "fromNodeId": "v3_line_32_p00",
        "toNodeId": "v3_line_32_p01",
        "lengthMeters": 87.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_33_p00_v3_line_33_p01",
        "fromNodeId": "v3_line_33_p00",
        "toNodeId": "v3_line_33_p01",
        "lengthMeters": 90.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_34_p00_v3_line_35_p01",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_35_p01",
        "lengthMeters": 87.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_35_p01_v3_line_37_p01",
        "fromNodeId": "v3_line_35_p01",
        "toNodeId": "v3_line_37_p01",
        "lengthMeters": 3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_37_p01_v3_line_38_p01",
        "fromNodeId": "v3_line_37_p01",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 60.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_38_p01_v3_line_36_p01",
        "fromNodeId": "v3_line_38_p01",
        "toNodeId": "v3_line_36_p01",
        "lengthMeters": 3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_36_p01_v3_line_34_p01",
        "fromNodeId": "v3_line_36_p01",
        "toNodeId": "v3_line_34_p01",
        "lengthMeters": 53.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_34_p01_v3_line_34_p02",
        "fromNodeId": "v3_line_34_p01",
        "toNodeId": "v3_line_34_p02",
        "lengthMeters": 111,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_35_p00_v3_line_35_p01",
        "fromNodeId": "v3_line_35_p00",
        "toNodeId": "v3_line_35_p01",
        "lengthMeters": 81.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_36_p00_v3_line_36_p01",
        "fromNodeId": "v3_line_36_p00",
        "toNodeId": "v3_line_36_p01",
        "lengthMeters": 84.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_37_p00_v3_line_37_p01",
        "fromNodeId": "v3_line_37_p00",
        "toNodeId": "v3_line_37_p01",
        "lengthMeters": 123.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_38_p00_v3_line_38_p01",
        "fromNodeId": "v3_line_38_p00",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 114.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "E_v3_line_12_p03_v3_line_29_p00",
        "fromNodeId": "v3_line_12_p03",
        "toNodeId": "v3_line_29_p00",
        "lengthMeters": 3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    }
]
};
