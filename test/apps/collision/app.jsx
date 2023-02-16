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

const ANCHORS = {start: 'start', middle: 'middle', end: 'end'};
const BASELINES = {top: 'top', center: 'center', bottom: 'bottom'};
const [LEFT, TOP, RIGHT, BOTTOM] = [0, 1, 2, 3];

/* eslint-disable react/no-deprecated */
export default function App() {
  const [collideEnabled, setCollideEnabled] = useState(true);
  const [borderEnabled, setBorderEnabled] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [anchor, setAnchor] = useState('start');
  const [baseline, setBaseline] = useState('center');

  const viewState = {longitude: -122, latitude: 37, zoom: 7};

  const fontSize = 16;
  const data = PLACES;
  const getPosition = f => f.geometry.coordinates;
  const getText = f => f.properties.name;
  const dataTransform = d => d.features;

  // Use heuristic to estimate typical size of text label
  const paddingX = 1.5 * fontSize;
  const paddingY = 8 * fontSize;
  const backgroundPadding = [0, 0, 0, 0];
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
        collideWrite: false,
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
        // fontFamily: 'Inter, sans',
        fontSettings: {sdf: true},
        outlineColor: [255, 255, 255],
        outlineWidth: 4,

        getTextAnchor: anchor,
        getAlignmentBaseline: baseline,
        // getPixelOffset: [20, 0],

        getBorderColor: [255, 0, 0, 80],
        getBorderWidth: borderEnabled ? 1 : 0,
        getBackgroundColor: [0, 255, 0, 0],
        background: true, // Need otherwise no background layer rendered
        backgroundPadding,

        parameters: {depthTest: false},
        extensions: [new CollideExtension()],
        collideEnabled,
        collideGroup: 'labels',

        _subLayerProps: {
          characters: {
            // Only render background layer to collideMap
            collideWrite: false
          }
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
