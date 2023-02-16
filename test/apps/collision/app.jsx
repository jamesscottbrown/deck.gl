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

  const props = {
    radiusUnits: 'pixels',
    getRadius: 3,
    // getFillColor: d => [25 * d.properties.scalerank, 255 - 25 * d.properties.scalerank, 123],
    getFillColor: [0, 0, 255],
    onClick: ({object}) => console.log(object.properties)
  };

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

  const layers = [
    showPoints &&
      new ScatterplotLayer({
        id: 'points',
        // data: PLACES,
        data: 'sf.bike.parking.json',
        getPosition: f => f.COORDINATES,

        // pointType: 'circle',
        ...props,

        extensions: [new CollideExtension()],
        collideEnabled,
        collideGroup: 'labels',
        // getCollidePriority: d => d.properties.scalerank,
        getCollidePriority: -400.8,
        collideTestProps: {
          pointAntialiasing: false, // Does this matter for collisions?
          radiusScale: 2 // Enlarge point to increase hit area
        }
      }),
    showLabels &&
      new TextLayer({
        id: 'collide-labels',
        // data: AIR_PORTS,
        data: 'sf.bike.parking.json',
        // dataTransform: d => d.slice(240, 250),

        getText: f => f.ADDRESS,
        getColor: [0, 155, 0],
        getSize: 24,
        getPosition: f => f.COORDINATES,
        fontFamily: 'Inter, sans',

        getAlignmentBaseline: 'bottom',
        getTextAnchor: 'start',

        // pickable: true,
        getBorderColor: [255, 0, 0, 80],
        getBorderWidth: borderEnabled ? 1 : 0,
        getBackgroundColor: [0, 255, 0, 0],
        background: true, // Need otherwise no background layer rendered
        backgroundPadding: [250, 0, 0, 32],

        parameters: {depthTest: false},
        extensions: [new CollideExtension()],
        // getCollidePriority: d => -d.properties.scalerank,
        collideEnabled,
        collideGroup: 'labels',
        getCollidePriority: 0.4,
        collideTestProps: {
          // sizeScale: 4 // Enlarge text to increase hit area
          // sizeScale: 2
        }
      })
  ];

  return (
    <>
      <DeckGL layers={layers} initialViewState={viewState} controller={true}></DeckGL>
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
