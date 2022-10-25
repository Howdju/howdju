import React from 'react'
import {View, Text, Image, StyleSheet} from 'react-native'

import type {ShareDataItem} from 'react-native-share-menu'

const ShareDataItemPreview = ({item}: {item: ShareDataItem}) => {
  const {value, mimeType, itemGroup, role} = item
  return (
    <View>
      <Text style={styles.mimeTypeText}>
        {mimeType} ({itemGroup ?? 'No Group'}, {role ?? 'No Role'})
      </Text>
      {mimeType.startsWith('text/') && <Text>{value}</Text>}
      {mimeType.startsWith('image/') && (
        <Image style={styles.image} resizeMode="contain" source={{uri: value}} />
      )}
      {mimeType.startsWith('application/pdf') && <Text>{value}</Text>}
      {mimeType.startsWith('audio/') && <Text>{value}</Text>}
      {mimeType.startsWith('video/') && <Text>{value}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  mimeTypeText: {
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
  },
})

export default ShareDataItemPreview
