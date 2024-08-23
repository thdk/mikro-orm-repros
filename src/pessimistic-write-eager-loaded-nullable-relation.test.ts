import { Entity, ManyToOne, MikroORM, PrimaryKey, Ref, defineConfig } from '@mikro-orm/postgresql'
import { LockMode } from '@mikro-orm/core'

@Entity({ tableName: 'tag_type' })
export class TagTypeEntity {
  @PrimaryKey()
  id!: string
}

@Entity({ tableName: 'tag' })
export class TagEntityWithEagerLoadedRelation {
  @PrimaryKey()
  id!: string

  // eager means that the related entity will be fetched automatically
  // https://mikro-orm.io/docs/next/decorators#manytoone
  @ManyToOne({ entity: () => TagTypeEntity, nullable: true, eager: true })
  type?: Ref<TagTypeEntity>
}

@Entity({ tableName: 'tag2' })
export class TagEntity {
  @PrimaryKey()
  id!: string

  @ManyToOne({ entity: () => TagTypeEntity, nullable: true })
  type?: Ref<TagTypeEntity>
}

describe('Test', () => {
  let orm: MikroORM

  beforeAll(async () => {
    orm = await MikroORM.init(defineConfig({
        dbName: 'postgres',
        user: 'postgres',
        password: 'postgres',
        host: 'localhost',
        port: 5232,
        entities: [TagEntity, TagTypeEntity, TagEntityWithEagerLoadedRelation]
    }));

    await orm.schema.refreshDatabase()
  })

  afterAll(async () => {
    await orm?.close()
  })

  test('should be able to lock a nullable relation with eager option set to true', async () => {
    await expect(
      orm.em.transactional(async (em) => {
        await em.find(
          TagEntityWithEagerLoadedRelation,
          { id: [] },
          { lockMode: LockMode.PESSIMISTIC_WRITE },
        )
      }),
    ).resolves.toBeUndefined()
  })

  test('should be able to lock a nullable relation', async () => {
    await expect(orm.em.transactional(async (em) => {
      await em.find(TagEntity, { id: [] }, { lockMode: LockMode.PESSIMISTIC_WRITE })
    })).resolves.toBeUndefined()
  })
})
