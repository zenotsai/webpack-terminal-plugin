
   
import { Options } from 'tsup'

export default <Options>{
  entryPoints: [
    'src/*.ts',
  ],
  clean: true,
  format: ['cjs', 'iife', 'esm'],
  dts: true,
}