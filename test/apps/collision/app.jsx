/* global fetch */
import React, {useCallback, useState, useMemo} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {COORDINATE_SYSTEM, OPERATION} from '@deck.gl/core';
import {GeoJsonLayer, ScatterplotLayer, SolidPolygonLayer, TextLayer} from '@deck.gl/layers';
import {CollideExtension, MaskExtension} from '@deck.gl/extensions';
import {parse} from '@loaders.gl/core';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json';
const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';
const PLACES =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_populated_places_simple.geojson';
const COUNTRIES =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson';
const US_STATES =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson'; //eslint-disable-line
const ANCHORS = {start: 'start', middle: 'middle', end: 'end'};
const BASELINES = {top: 'top', center: 'center', bottom: 'bottom'};

const basemap = new GeoJsonLayer({
  id: 'base-map',
  data: COUNTRIES,
  // Styles
  stroked: true,
  filled: true,
  lineWidthMinPixels: 2,
  opacity: 0.4,
  getLineColor: [60, 60, 60],
  getFillColor: [200, 200, 200]
});

const [LEFT, TOP, RIGHT, BOTTOM] = [0, 1, 2, 3];

/* eslint-disable react/no-deprecated */
export default function App() {
  const [collideEnabled, setCollideEnabled] = useState(true);
  const [borderEnabled, setBorderEnabled] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [anchor, setAnchor] = useState('middle');
  const [baseline, setBaseline] = useState('center');

  const viewState = {
    longitude: -122.42177834,
    latitude: 37.78346622,
    zoom: 12,
    maxZoom: 20,
    pitch: 0,
    bearing: 0
  };

  const fontSize = 18;
  const data = 'sf.bike.parking.json';
  // const data = AIR_PORTS;
  const getPosition = f => f.COORDINATES || f.geometry.coordinates;
  const getText = f => f.ADDRESS || f.properties.name;
  const dataTransform = d => (d.features ? d.features : d);

  const backgroundPadding = [0, 0, 0, 0]; // 12 * fontSize, 0.75 * fontSize, 0, 0.75 * fontSize]; // Offset in opposite direction to alignment/anchor
  const paddingX = 1.5 * fontSize;
  const paddingY = 8 * fontSize;
  if (baseline === 'top') {
    backgroundPadding[TOP] = paddingX;
  } else if (baseline === 'bottom') {
    backgroundPadding[BOTTOM] = paddingX;
  } else {
    backgroundPadding[TOP] = 0.5 * paddingX;
    backgroundPadding[BOTTOM] = 0.5 * paddingX;
  }
  if (anchor === 'start') {
    backgroundPadding[LEFT] = paddingY;
  } else if (anchor === 'end') {
    backgroundPadding[RIGHT] = paddingY;
  } else {
    backgroundPadding[LEFT] = 0.5 * paddingY;
    backgroundPadding[RIGHT] = 0.5 * paddingY;
  }

  const pointProps = {
    data,
    dataTransform,
    getPosition,
    radiusUnits: 'pixels',
    stroked: true,
    lineWidthMinPixels: 1,
    billboard: true,
    getFillColor: [0, 0, 255],
    getLineColor: [255, 255, 255]
  };

  const layers = [
    showPoints && new ScatterplotLayer({id: 'points', getRadius: 2, ...pointProps}),
    showPoints &&
      new ScatterplotLayer({
        id: 'highlighted-points',
        getRadius: 5,
        ...pointProps,

        extensions: [new CollideExtension()],
        collideEnabled,
        collideGroup: 'labels'
      }),
    showLabels &&
      new TextLayer({
        id: 'collide-labels',
        data,
        dataTransform,

        getColor: [44, 48, 50],
        getSize: fontSize,
        getPosition,
        getText,

        // FONT
        fontFamily: 'Inter, sans',
        fontSettings: {sdf: true},
        outlineColor: [255, 255, 255],
        outlineWidth: 4,

        getTextAnchor: anchor,
        getAlignmentBaseline: baseline,
        // getPixelOffset: [20, 0],

        // pickable: true,
        getBorderColor: [255, 0, 0, 80],
        getBorderWidth: borderEnabled ? 1 : 0,
        getBackgroundColor: [0, 255, 0, 0],
        background: true, // Need otherwise no background layer rendered
        backgroundPadding,

        parameters: {depthTest: false},
        extensions: [new CollideExtension()],
        // getCollidePriority: d => -d.properties.scalerank,
        collideEnabled,
        collideGroup: 'labels',
        // getCollidePriority: 0.4,
        collideTestProps: {
          // sizeScale: 4 // Enlarge text to increase hit area
          // sizeScale: 2
        },

        updateTriggers: {
          getAlignmentBaseline: [baseline]
        }
      })
  ];

  return (
    <>
      <DeckGL layers={layers} initialViewState={viewState} controller={true}>
        <StaticMap reuseMaps mapStyle={MAP_STYLE} preventStyleDiffing={true} />
      </DeckGL>
      <div style={{left: 200, position: 'absolute', background: 'white', padding: 10}}>
        <label>
          <input
            type="checkbox"
            checked={collideEnabled}
            onChange={() => setCollideEnabled(!collideEnabled)}
          />
          Collisions
        </label>
        <label>
          <input
            type="checkbox"
            checked={borderEnabled}
            onChange={() => setBorderEnabled(!borderEnabled)}
          />
          Border
        </label>
        <label>
          <input type="checkbox" checked={showPoints} onChange={() => setShowPoints(!showPoints)} />
          Show points
        </label>
        <label>
          <input type="checkbox" checked={showLabels} onChange={() => setShowLabels(!showLabels)} />
          Show labels
        </label>
        <ObjectSelect title="Anchor" obj={ANCHORS} value={anchor} onSelect={setAnchor} />
        <ObjectSelect title="Baseline" obj={BASELINES} value={baseline} onSelect={setBaseline} />
      </div>
    </>
  );
}

function ObjectSelect({title, obj, value, onSelect}) {
  const keys = Object.values(obj).sort();
  return (
    <>
      <select
        onChange={e => onSelect(e.target.value)}
        style={{position: 'relative', padding: 4, margin: 2, width: 130}}
        value={value}
      >
        <option hidden>{title}</option>
        {keys.map(f => (
          <option key={f} value={f}>
            {`${title}: ${f}`}
          </option>
        ))}
      </select>
    </>
  );
}

render(<App />, document.getElementById('app'));
