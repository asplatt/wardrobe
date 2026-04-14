import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { C } from '../theme';

import TodayScreen from '../screens/TodayScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';
import BulkUploadScreen from '../screens/BulkUploadScreen';
import TagItemScreen from '../screens/TagItemScreen';

export type RootStackParamList = {
  Tabs: undefined;
  ItemDetail: { id: string };
  AddItem: undefined;
  BulkUpload: undefined;
  TagItem: { stagedIds: string[]; index: number };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Today: '🏠', Wardrobe: '👔', Add: '+',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: name === 'Add' ? 22 : 18, color: focused ? C.text : C.muted }}>
        {icons[name]}
      </Text>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.border },
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 2 },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Today" focused={focused} /> }}
      />
      <Tab.Screen
        name="Wardrobe"
        component={WardrobeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Wardrobe" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item' }} />
        <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
        <Stack.Screen name="BulkUpload" component={BulkUploadScreen} options={{ title: 'Bulk Upload' }} />
        <Stack.Screen name="TagItem" component={TagItemScreen} options={{ title: 'Tag Item', headerBackTitle: 'Skip' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
