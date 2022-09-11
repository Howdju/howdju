import React, {useEffect, useState} from 'react';
import {FlatList, GestureResponderEvent, View, Text, Pressable, StyleSheet} from 'react-native';
import {ShareMenuReactView, SharePreviewResponse} from 'react-native-share-menu';

import ShareDataItemPreview from '@/views/ShareDataItemPreview';

const Share = () => {
  const [sharePreviewResponse, setSharePreviewResponse] = useState<SharePreviewResponse>({items:[]});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    ShareMenuReactView.data()
      .then((sharePreviewResponse: SharePreviewResponse) => {
        setSharePreviewResponse(sharePreviewResponse);
      })
      .catch(console.error);
  }, []);

  console.log({sharePreviewResponse})
  const items = sharePreviewResponse?.items;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="Dismiss"
          onPress={() => {
            ShareMenuReactView.dismissExtension();
          }}
          style={styles.destructive}
        />
        <Button
          title={sending ? 'Sending...' : 'Send'}
          onPress={() => {
            setSending(true);

            setTimeout(() => {
              ShareMenuReactView.dismissExtension();
            }, 3000);
          }}
          disabled={sending}
          style={sending ? styles.sending : styles.send}
        />
      </View>
      <FlatList 
        data={items}
        renderItem={({item}) => (
          <ShareDataItemPreview item={item} />
        )}>
      </FlatList>
      <View style={styles.buttonGroup}>
        <Button
          title="Dismiss with Error"
          onPress={() => {
            ShareMenuReactView.dismissExtension('Dismissed with error');
          }}
          style={styles.destructive}
        />
        <Button
          title="Continue In App"
          onPress={() => {
            ShareMenuReactView.continueInApp();
          }}
        />
        <Button
          title="Continue In App With Extra Data"
          onPress={() => {
            ShareMenuReactView.continueInApp({hello: 'from the other side'});
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  destructive: {
    color: 'red',
  },
  send: {
    color: 'blue',
  },
  sending: {
    color: 'grey',
  },
  buttonGroup: {
    alignItems: 'center',
  },
});

type ButtonProps = {
  onPress: (event: GestureResponderEvent) => void,
  title: string,
  style?: typeof styles[keyof typeof styles],
  disabled?: boolean
}

const Button = ({onPress, title, style, disabled}: ButtonProps) => (
  <Pressable onPress={onPress} disabled={disabled}>
    <Text style={[{fontSize: 16, margin: 16}, style]}>{title}</Text>
  </Pressable>
);

export default Share;
