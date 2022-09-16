import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { covertHourStringToMinutes } from './utils/covert-hour-string-to-minutes'
import { covertMinutesToHourString } from './utils/covert-minutes-to-hour-string'

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
  log: ['query']
})

// HTTP methods / API RESTful / HTTP Codes

app.get('/games', async (req, res) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        }
      }
    }
  })
  
  return res.json([games])
})

app.post('/games/:id/ads', async (req, res) => {
  const gameId = req.params.id
  const body: any = req.body

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hourStart: covertHourStringToMinutes(body.hourStart),
      hourEnd: covertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel
    }
  })

  return res.status(201).json(ad)
})

app.get('/games/:id/ads', async (req, res) => {
  const gameId = req.params.id

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return res.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: covertMinutesToHourString(ad.hourStart),
      hourEnd: covertMinutesToHourString(ad.hourEnd)
    }
  }))
})

app.get('/ads/:id/discord', async (req, res) => {
  const adId = req.params.id

  const ad = await prisma.ad.findUnique({
    select: {
      discord: true
    },
    where: {
      id: adId,
    }
  })

  if(ad === null) {
    return res.json("Não foi possivel encontrar o id")
  } else{
    return res.json({
      discord: ad.discord
    })
  }
})

app.listen(3333)
