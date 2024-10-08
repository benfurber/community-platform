import * as React from 'react'
import { ZoomControl } from 'react-leaflet'
import { Alert, Box, Flex, Text } from 'theme-ui'

import { Button } from '../Button/Button'
import { Map } from '../Map/Map.client'
import { OsmGeocoding } from '../OsmGeocoding/OsmGeocoding'
import { MapPin } from './MapPin.client'

import type { LeafletMouseEvent } from 'leaflet'
import type { Result } from '../OsmGeocoding/types'

import 'leaflet/dist/leaflet.css'

const useUserLocation = 'Use my current location'
const mapInstructions =
  "You can click on the map, or drag the marker to adjust it's position."

export interface Props {
  position: {
    lat: number
    lng: number
  }
  draggable: boolean
  updatePosition?: any
  center?: any
  zoom?: number
  hasUserLocation?: boolean
}

export const MapWithPin = (props: Props) => {
  const [zoom, setZoom] = React.useState(props.zoom || 1)
  const [center, setCenter] = React.useState(
    props.center || [props.position.lat, props.position.lng],
  )
  const { draggable, position } = props

  const hasUserLocation = props.hasUserLocation || false
  const onPositionChanged =
    props.updatePosition ||
    function () {
      // do nothing
    }

  const setLocationToNavigatorLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onPositionChanged({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setCenter([position.coords.latitude, position.coords.longitude])
        setZoom(15)
      },
      () => {
        // do nothing
      },
    )
  }

  const onClick = (evt: LeafletMouseEvent) => {
    onPositionChanged({ ...evt.latlng })
  }

  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      {draggable && (
        <Alert
          variant="info"
          sx={{
            marginTop: 2,
          }}
        >
          <Text sx={{ fontSize: 1 }}>{mapInstructions}</Text>
        </Alert>
      )}
      <div
        style={{
          position: 'relative',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            padding: 2,
            zIndex: 2,
          }}
        >
          {draggable && (
            <Flex style={{ width: '280px' }}>
              <OsmGeocoding
                callback={(data: Result) => {
                  if (data.lat && data.lon) {
                    onPositionChanged({
                      lat: data.lat,
                      lng: data.lon,
                    })
                    setCenter([data.lat, data.lon])
                    setZoom(15)
                  }
                }}
                countrycodes=""
                acceptLanguage="en"
              />
              {hasUserLocation && (
                <Button
                  type="button"
                  mx={2}
                  onClick={(evt) => {
                    evt.preventDefault()
                    setLocationToNavigatorLocation()
                  }}
                >
                  {useUserLocation}
                </Button>
              )}
            </Flex>
          )}
        </Box>
        <Map
          center={center}
          zoom={zoom}
          zoomControl={false}
          setZoom={setZoom}
          onclick={onClick}
          style={{
            height: '300px',
            zIndex: 1,
          }}
        >
          <ZoomControl position="topright" />
          <MapPin
            position={position}
            draggable={draggable}
            ondragend={(evt: any) => {
              if (evt.lat && evt.lng)
                onPositionChanged({
                  lat: evt.lat,
                  lng: evt.lng,
                })
            }}
          />
        </Map>
      </div>
    </Flex>
  )
}
