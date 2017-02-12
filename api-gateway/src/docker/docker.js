'use strict'
const Docker = require('dockerode')

const discoverRoutes = (container) => {
  return new Promise((resolve, reject) => {
    const dockerSettings = container.resolve('dockerSettings')

    const docker = new Docker(dockerSettings)

    // generate upstream url from containerDetails
    const getUpstreamUrl = (containerDetails) => {
      const port = containerDetails.Ports[0].PublicPort
      return `http://${dockerSettings.host}:${port}`
    }

    const routes = new Proxy({}, {
      get (target, key) {
        console.log(`Get on property "${key}"`)
        return Reflect.get(target, key)
      }
    })

    docker.listContainers((err, containers) => {
      if (err) {
        reject(new Error('an error occured listing containers, err: ' + err))
      }
      containers.forEach((containerInfo) => {
        if (!/mongo/.test(containerInfo.Names[0])) {
          routes[containerInfo.Id] = {
            id: containerInfo.Id,
            name: containerInfo.Names[0].split('').splice(1).join(''),
            route: containerInfo.Labels.apiRoute,
            target: getUpstreamUrl(containerInfo)
          }
        }
      })
      resolve(routes)
    })
  })
}

module.exports = Object.assign({}, {discoverRoutes})
