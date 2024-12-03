import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import Header from '../../components/home/Header'
import Display from '../../components/home/Display'
import Maps from '../../components/home/Maps'


export default function home() {
  return (
    <ScrollView>
     {/* Header */}
    <Header/>

    {/* to display the recent location */}
    <Display/>
  
    {/* the live location of the vehicle  */}
    <Maps/>
     
    </ScrollView>
  )
}