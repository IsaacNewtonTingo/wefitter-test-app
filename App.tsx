import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  NativeEventEmitter,
  Button,
  Platform,
  Alert,
  PermissionsAndroid,
  Permission,
} from 'react-native';
import WeFitterAndroid from 'react-native-wefitter-android';

export default function App() {
  const [connected, setConnected] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      WeFitterAndroid.isSupported((supported: boolean) =>
        setSupported(supported),
      );
    }
  }, []);

  useEffect(() => {
    if (supported) {
      // create native event emitter and event listeners to handle status updates
      const emitter = new NativeEventEmitter();
      const configuredListener = emitter.addListener(
        'onConfiguredWeFitterAndroid',
        (event: {configured: boolean}) =>
          console.log(`WeFitterAndroid configured: ${event.configured}`),
      );
      const connectedListener = emitter.addListener(
        'onConnectedWeFitterAndroid',
        (event: {connected: boolean}) => {
          console.log(`WeFitterAndroid connected: ${event.connected}`);
          setConnected(event.connected);
        },
      );
      const errorListener = emitter.addListener(
        'onErrorWeFitterAndroid',
        (event: {error: string}) => {
          console.log(`WeFitterAndroid error: ${event.error}`);
        },
      );

      // create config
      const config = {
        token: 'YOUR_TOKEN', // required
        apiUrl: 'YOUR_API_URL', // required
        notificationTitle: 'CUSTOM_TITLE', // optional
        notificationText: 'CUSTOM_TEXT', // optional
        notificationIcon: 'CUSTOM_ICON', // optional, e.g. `ic_notification` placed in either drawable, mipmap or raw
        notificationChannelId: 'CUSTOM_CHANNEL_ID', // optional
        notificationChannelName: 'CUSTOM_CHANNEL_NAME', // optional
      };

      // configure WeFitterAndroid
      WeFitterAndroid.configure(config);

      return () => {
        configuredListener.remove();
        connectedListener.remove();
        errorListener.remove();
      };
    }
    return;
  }, [supported]);

  const onPressConnectOrDisconnect = () => {
    if (Platform.OS === 'android') {
      if (supported) {
        connected ? WeFitterAndroid.disconnect() : checkPermissionAndConnect();
      } else {
        Alert.alert(
          'Not supported',
          'This device does not have a sensor to count steps',
        );
      }
    } else {
      Alert.alert('Not supported', 'WeFitterAndroid is not supported on iOS');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Connected: {'' + connected}</Text>
      <Button
        onPress={onPressConnectOrDisconnect}
        title={connected ? 'Disconnect' : 'Connect'}
      />
    </View>
  );
}

const checkPermissionAndConnect = async () => {
  // On 29+ a runtime permission needs to be requested before connecting
  if (Platform.Version >= 29) {
    const granted = await PermissionsAndroid.request(
      'android.permission.ACTIVITY_RECOGNITION' as Permission,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      // connect if requested permission has been granted
      WeFitterAndroid.connect();
    }
  } else {
    WeFitterAndroid.connect();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
