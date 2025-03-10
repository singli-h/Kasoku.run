"use client"

import React from 'react'
import { Menu } from '@headlessui/react'
import { Button } from "@/components/ui/button"

export function TestDropdown() {
  console.log("TestDropdown rendering with HeadlessUI");
  
  return (
    <div className="fixed top-5 right-5 z-[3000]">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button as={React.Fragment}>
            <Button 
              variant="default" 
              className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg py-6 px-8 rounded-lg shadow-lg border-4 border-red-300"
            >
              HeadlessUI Test Menu
            </Button>
          </Menu.Button>
        </div>
        
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[3000]">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-red-100 text-red-700' : 'text-gray-900'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium`}
                >
                  HeadlessUI Item 1
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-red-100 text-red-700' : 'text-gray-900'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium`}
                >
                  HeadlessUI Item 2
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-red-100 text-red-700' : 'text-gray-900'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium`}
                >
                  HeadlessUI Item 3
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Menu>
    </div>
  )
} 