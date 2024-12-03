import { Text, StyleSheet, View,Image, TextInput } from 'react-native'
import React, { Component } from 'react'

import {Colors} from '../../constants/Colors'
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Header(){


    return (
      <View style={{
        padding:20,
        paddingTop:40,
        backgroundColor:Colors.PRIMARY,
    
       
      }}>
        <View style={{
            display:'flex',
            flexDirection:'row',
            alignItems:'center',
            gap:10
        }}>
            
            <View>
                <Text style={{color:'white'}}>Welcome,</Text>
                <Text style={{fontSize:19,fontFamily:'flux-medium',color:'white'}}>name</Text>
            </View>

        </View>

        
      </View>
    )
  
}

const styles = StyleSheet.create({})