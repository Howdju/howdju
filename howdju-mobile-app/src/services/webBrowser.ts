import {Linking} from 'react-native'

export async function openUrl(url: string) {
  await Linking.canOpenURL(url)
  Linking.openURL(url)
}
