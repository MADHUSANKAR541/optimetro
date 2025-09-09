'use client';

import { useState, useCallback } from 'react';
import { MapState, MapLayer } from '@/lib/types';
import { MAP_CONFIG } from '@/lib/mapConfig';

const defaultLayers: MapLayer[] = [
  { id: 'stations', name: 'Stations', visible: true, type: 'stations' },
  { id: 'lines', name: 'Metro Lines', visible: true, type: 'lines' },
  { id: 'alerts', name: 'Service Alerts', visible: true, type: 'alerts' },
  { id: 'routes', name: 'Routes', visible: true, type: 'routes' },
  { id: 'depot', name: 'Depot', visible: false, type: 'depot' }
];

export function useMapState(initialCenter?: [number, number], initialZoom?: number) {
  const [mapState, setMapState] = useState<MapState>({
    center: initialCenter || MAP_CONFIG.defaultCenter,
    zoom: initialZoom || MAP_CONFIG.defaultZoom,
    layers: defaultLayers,
    selectedStation: undefined,
    selectedRoute: undefined,
    selectedTrain: undefined,
    selectedAlert: undefined
  });

  const updateCenter = useCallback((center: [number, number]) => {
    setMapState(prev => ({ ...prev, center }));
  }, []);

  const updateZoom = useCallback((zoom: number) => {
    setMapState(prev => ({ ...prev, zoom }));
  }, []);

  const toggleLayer = useCallback((layerId: string) => {
    setMapState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    }));
  }, []);

  const setLayerVisibility = useCallback((layerId: string, visible: boolean) => {
    setMapState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId
          ? { ...layer, visible }
          : layer
      )
    }));
  }, []);

  const selectStation = useCallback((stationId?: string) => {
    setMapState(prev => ({ ...prev, selectedStation: stationId }));
  }, []);

  const selectRoute = useCallback((routeId?: string) => {
    setMapState(prev => ({ ...prev, selectedRoute: routeId }));
  }, []);

  const selectTrain = useCallback((trainId?: string) => {
    setMapState(prev => ({ ...prev, selectedTrain: trainId }));
  }, []);

  const selectAlert = useCallback((alertId?: string) => {
    setMapState(prev => ({ ...prev, selectedAlert: alertId }));
  }, []);

  const clearSelection = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      selectedStation: undefined,
      selectedRoute: undefined,
      selectedTrain: undefined,
      selectedAlert: undefined
    }));
  }, []);

  const resetMap = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      selectedStation: undefined,
      selectedRoute: undefined,
      selectedTrain: undefined,
      selectedAlert: undefined
    }));
  }, []);

  const getVisibleLayers = useCallback(() => {
    return mapState.layers.filter(layer => layer.visible);
  }, [mapState.layers]);

  const isLayerVisible = useCallback((layerId: string) => {
    const layer = mapState.layers.find(l => l.id === layerId);
    return layer?.visible || false;
  }, [mapState.layers]);

  return {
    mapState,
    updateCenter,
    updateZoom,
    toggleLayer,
    setLayerVisibility,
    selectStation,
    selectRoute,
    selectTrain,
    selectAlert,
    clearSelection,
    resetMap,
    getVisibleLayers,
    isLayerVisible
  };
}
