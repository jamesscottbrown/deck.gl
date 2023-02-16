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

/* eslint-disable react/no-deprecated */
export default function App() {
  const [collideEnabled, setCollideEnabled] = useState(true);
  const [borderEnabled, setBorderEnabled] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedCounty, selectCounty] = useState(null);

  const viewState = {
    longitude: -122.42177834,
    latitude: 37.78346622,
    zoom: 12,
    maxZoom: 20,
    pitch: 0,
    bearing: 0
  };

  const onClickState = useCallback(info => selectCounty(info.object), []);
  const onDataLoad = useCallback(geojson => {
    const california = geojson.features.find(f => f.properties.name === 'California');
    selectCounty(california);
  }, []);

  const fontSize = 18;
  const data = 'sf.bike.parking.json';
  // const data = AIR_PORTS;
  const getPosition = f => f.COORDINATES || f.geometry.coordinates;
  const getText = f => f.ADDRESS || f.properties.name;
  const dataTransform = d => (d.features ? d.features : d);

  const layers = [
    showPoints &&
      new ScatterplotLayer({
        id: 'points',
        data,
        dataTransform,
        getPosition,
        radiusUnits: 'pixels',
        getRadius: 3,
        getFillColor: [0, 0, 255],

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

        getAlignmentBaseline: 'center',
        getTextAnchor: 'start',

        // pickable: true,
        getBorderColor: [255, 0, 0, 80],
        getBorderWidth: borderEnabled ? 1 : 0,
        getBackgroundColor: [0, 255, 0, 0],
        background: true, // Need otherwise no background layer rendered
        backgroundPadding: [12 * fontSize, 0.75 * fontSize, 0, 0.75 * fontSize], // Offset in opposite direction to alignment/anchor

        parameters: {depthTest: false},
        extensions: [new CollideExtension()],
        // getCollidePriority: d => -d.properties.scalerank,
        collideEnabled,
        collideGroup: 'labels',
        // getCollidePriority: 0.4,
        collideTestProps: {
          // sizeScale: 4 // Enlarge text to increase hit area
          // sizeScale: 2
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
      </div>
    </>
  );
}

render(<App />, document.getElementById('app'));
